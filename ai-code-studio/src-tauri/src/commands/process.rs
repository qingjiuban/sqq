use serde::Serialize;
use std::collections::HashMap;
use std::io::{BufRead, BufReader};
use std::process::{Child, Command, Stdio};
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Arc, Mutex};
use std::thread::JoinHandle;
use std::time::{Duration, Instant};
use tauri::State;

use super::filesystem::ProjectState;

/// Commands the agent is allowed to execute. Anything outside this list is
/// rejected before a process is ever spawned.
const ALLOWED: &[&str] = &[
    "node", "npm", "pnpm", "npx", "yarn", "bun", "git", "vite", "tsc", "cargo", "rustc",
    "go", "python", "python3", "pip", "pip3", "make", "deno", "php", "ruby", "bundle",
    "rails", "mvn", "gradle", "dotnet", "uvicorn", "gunicorn", "flask", "dotnet",
];

/// Hard blocks: shells and destructive system tools are never allowed, even if
/// a user tries to enable full-auto mode.
const FORBIDDEN: &[&str] = &[
    "bash", "sh", "zsh", "dash", "cmd", "powershell", "pwsh", "sudo", "su", "rm", "rmdir",
    "mkfs", "dd", "shutdown", "reboot", "poweroff", "kill", "killall", "pkill", "chmod",
    "chown", "mount", "umount", "iptables", "systemctl", "curl", "wget", "nc", "ncat",
    "ssh", "scp", "telnet", "eval", "exec",
];

/// Shell metacharacters rejected inside arguments so an argument cannot be used
/// to chain a second command.
const SHELL_META: &[&str] = &[";", "&&", "||", "|", "`", "$(", ">", "<", "&", "\n"];

static COUNTER: AtomicU64 = AtomicU64::new(1);

#[derive(Default, Clone, Serialize)]
pub struct OutputBuffer {
    pub stdout: String,
    pub stderr: String,
}

struct RunningProcess {
    command: String,
    child: Child,
    output: Arc<Mutex<OutputBuffer>>,
}

#[derive(Default)]
pub struct ProcessState {
    processes: Mutex<HashMap<String, RunningProcess>>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CommandResult {
    pub process_id: String,
    pub command: String,
    pub running: bool,
    pub timed_out: bool,
    pub exit_code: Option<i32>,
    pub stdout: String,
    pub stderr: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProcessOutput {
    pub process_id: String,
    pub command: String,
    pub running: bool,
    pub exit_code: Option<i32>,
    pub stdout: String,
    pub stderr: String,
}

/// Mobile-safe subset: interpreters and package managers only, so a dev server
/// can run inside the app sandbox. Anything that touches the network stack or
/// the system is still blocked by FORBIDDEN.
#[cfg(any(target_os = "android", target_os = "ios"))]
const MOBILE_ALLOWED: &[str] = &[
    "node", "npm", "pnpm", "npx", "yarn", "bun", "vite", "tsc", "deno",
    "python", "python3", "pip", "pip3", "uvicorn", "gunicorn", "flask",
];

pub fn validate_command(command: &str, args: &[String]) -> Result<(), String> {
    let command = command.trim();
    if command.is_empty() {
        return Err("Command must not be empty".into());
    }
    if command.contains('/') || command.contains('\\') {
        return Err("Command must be a bare executable name, not a path".into());
    }
    let base = command.to_lowercase();
    if FORBIDDEN.contains(&base.as_str()) {
        return Err(format!("Command \"{command}\" is blocked by the command policy"));
    }
    #[cfg(any(target_os = "android", target_os = "ios"))]
    let allowed: &[&str] = MOBILE_ALLOWED;
    #[cfg(not(any(target_os = "android", target_os = "ios")))]
    let allowed: &[&str] = ALLOWED;
    if !allowed.contains(&base.as_str()) {
        return Err(format!(
            "Command \"{command}\" is not in the allow list (allowed: {})",
            allowed.join(", ")
        ));
    }
    for arg in args {
        for meta in SHELL_META {
            if arg.contains(meta) {
                return Err(format!(
                    "Argument \"{arg}\" contains the shell metacharacter \"{meta}\" and was rejected"
                ));
            }
        }
    }
    Ok(())
}

fn spawn_reader<R: std::io::Read + Send + 'static>(
    reader: R,
    output: Arc<Mutex<OutputBuffer>>,
    is_stdout: bool,
) -> JoinHandle<()> {
    std::thread::spawn(move || {
        let buffered = BufReader::new(reader);
        for line in buffered.lines() {
            let Ok(line) = line else { break };
            if let Ok(mut buffer) = output.lock() {
                let target = if is_stdout {
                    &mut buffer.stdout
                } else {
                    &mut buffer.stderr
                };
                target.push_str(&line);
                target.push('\n');
            }
        }
    })
}

fn snapshot(output: &Arc<Mutex<OutputBuffer>>) -> OutputBuffer {
    output.lock().map(|b| b.clone()).unwrap_or_default()
}

fn display_command(command: &str, args: &[String]) -> String {
    if args.is_empty() {
        command.to_string()
    } else {
        format!("{command} {}", args.join(" "))
    }
}

/// Run a command in the project root. Waits up to `timeout_ms` (default 30s).
/// If the process finishes within the timeout the captured output is returned
/// directly; otherwise the process keeps running in the background and its id
/// can be used with `get_process_output` / `kill_process`.
#[tauri::command]
pub fn run_command(
    command: String,
    args: Option<Vec<String>>,
    timeout_ms: Option<u64>,
    process_state: State<ProcessState>,
    project_state: State<ProjectState>,
) -> Result<CommandResult, String> {
    let args = args.unwrap_or_default();
    validate_command(&command, &args)?;

    let root = project_state
        .root
        .lock()
        .unwrap()
        .clone()
        .ok_or_else(|| "No project opened".to_string())?;

    let mut child = Command::new(&command)
        .args(&args)
        .current_dir(&root)
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to start \"{command}\": {e}"))?;

    let output = Arc::new(Mutex::new(OutputBuffer::default()));
    let stdout = child.stdout.take().ok_or("Failed to capture stdout")?;
    let stderr = child.stderr.take().ok_or("Failed to capture stderr")?;
    let stdout_handle = spawn_reader(stdout, output.clone(), true);
    let stderr_handle = spawn_reader(stderr, output.clone(), false);

    let id = format!(
        "proc_{}_{}",
        COUNTER.fetch_add(1, Ordering::SeqCst),
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_millis())
            .unwrap_or(0)
    );
    let display = display_command(&command, &args);
    let timeout = Duration::from_millis(timeout_ms.unwrap_or(30_000).min(600_000));
    let started = Instant::now();

    loop {
        match child.try_wait().map_err(|e| e.to_string())? {
            Some(status) => {
                let _ = stdout_handle.join();
                let _ = stderr_handle.join();
                let buffer = snapshot(&output);
                return Ok(CommandResult {
                    process_id: id,
                    command: display,
                    running: false,
                    timed_out: false,
                    exit_code: status.code(),
                    stdout: buffer.stdout,
                    stderr: buffer.stderr,
                });
            }
            None => {
                if started.elapsed() >= timeout {
                    let buffer = snapshot(&output);
                    process_state
                        .processes
                        .lock()
                        .unwrap()
                        .insert(id.clone(), RunningProcess {
                            command: display.clone(),
                            child,
                            output: output.clone(),
                        });
                    return Ok(CommandResult {
                        process_id: id,
                        command: display,
                        running: true,
                        timed_out: true,
                        exit_code: None,
                        stdout: buffer.stdout,
                        stderr: buffer.stderr,
                    });
                }
                std::thread::sleep(Duration::from_millis(80));
            }
        }
    }
}

#[tauri::command]
pub fn get_process_output(
    process_id: String,
    process_state: State<ProcessState>,
) -> Result<ProcessOutput, String> {
    let mut map = process_state.processes.lock().unwrap();
    let entry = map
        .get_mut(&process_id)
        .ok_or_else(|| format!("No running process with id \"{process_id}\""))?;

    let exited = entry.child.try_wait().map_err(|e| e.to_string())?;
    let buffer = snapshot(&entry.output);
    let command = entry.command.clone();

    if let Some(status) = exited {
        let code = status.code();
        map.remove(&process_id);
        return Ok(ProcessOutput {
            process_id,
            command,
            running: false,
            exit_code: code,
            stdout: buffer.stdout,
            stderr: buffer.stderr,
        });
    }

    Ok(ProcessOutput {
        process_id,
        command,
        running: true,
        exit_code: None,
        stdout: buffer.stdout,
        stderr: buffer.stderr,
    })
}

#[tauri::command]
pub fn kill_process(
    process_id: String,
    process_state: State<ProcessState>,
) -> Result<bool, String> {
    let mut map = process_state.processes.lock().unwrap();
    if let Some(mut entry) = map.remove(&process_id) {
        entry.child.kill().map_err(|e| e.to_string())?;
        let _ = entry.child.wait();
        return Ok(true);
    }
    Ok(false)
}

#[tauri::command]
pub fn list_processes(process_state: State<ProcessState>) -> Result<Vec<String>, String> {
    let map = process_state.processes.lock().unwrap();
    Ok(map
        .iter()
        .map(|(id, entry)| format!("{}: {}", id, entry.command))
        .collect())
}

/// Probe whether a bare executable can be spawned on this device. Used at boot
/// to decide if the mobile sandbox has a usable Node.js runtime.
#[tauri::command]
pub fn probe_runtime(binary: String) -> bool {
    let binary = binary.trim().to_lowercase();
    if FORBIDDEN.contains(&binary.as_str()) {
        return false;
    }
    Command::new(&binary)
        .arg("--version")
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn()
        .map(|mut child| {
            let _ = child.wait();
            true
        })
        .unwrap_or(false)
}

/// Check whether something is accepting TCP connections on 127.0.0.1:<port>.
/// Used by the preview panel to know when a dev server is actually serving.
#[tauri::command]
pub fn check_port(port: u16) -> bool {
    std::net::TcpStream::connect_timeout(
        &std::net::SocketAddr::from(([127, 0, 0, 1], port)),
        Duration::from_millis(400),
    )
    .is_ok()
}

/// Ask the OS for an unused port by binding to port 0 and reading it back.
#[tauri::command]
pub fn find_free_port() -> Result<u16, String> {
    let listener = std::net::TcpListener::bind(("127.0.0.1", 0)).map_err(|e| e.to_string())?;
    let port = listener.local_addr().map_err(|e| e.to_string())?.port();
    drop(listener);
    Ok(port)
}
