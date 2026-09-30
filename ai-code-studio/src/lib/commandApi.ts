import { invoke } from "@tauri-apps/api/core";
import { isTauri } from "./tauri";

export interface CommandResult {
  processId: string;
  command: string;
  running: boolean;
  timedOut: boolean;
  exitCode: number | null;
  stdout: string;
  stderr: string;
}

export interface ProcessOutput {
  processId: string;
  command: string;
  running: boolean;
  exitCode: number | null;
  stdout: string;
  stderr: string;
}

export function canRunCommands(): boolean {
  return isTauri();
}

export function runCommand(
  command: string,
  args: string[] = [],
  timeoutMs?: number,
): Promise<CommandResult> {
  return invoke<CommandResult>("run_command", {
    command,
    args,
    timeoutMs: timeoutMs ?? null,
  });
}

export function getProcessOutput(processId: string): Promise<ProcessOutput> {
  return invoke<ProcessOutput>("get_process_output", { processId });
}

export function killProcess(processId: string): Promise<boolean> {
  return invoke<boolean>("kill_process", { processId });
}

export function listProcesses(): Promise<string[]> {
  return invoke<string[]>("list_processes");
}

export function checkPort(port: number): Promise<boolean> {
  return invoke<boolean>("check_port", { port });
}

export function findFreePort(): Promise<number> {
  return invoke<number>("find_free_port");
}

export function probeRuntime(binary: string): Promise<boolean> {
  return invoke<boolean>("probe_runtime", { binary });
}
