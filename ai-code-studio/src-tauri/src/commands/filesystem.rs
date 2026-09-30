use serde::Serialize;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use tauri::State;

const IGNORED_DIRS: &[&str] = &[
    "node_modules",
    "target",
    "dist",
    ".git",
    ".pnpm-store",
    ".turbo",
];

pub struct ProjectState {
    pub root: Mutex<Option<PathBuf>>,
}

#[derive(Serialize)]
pub struct FileEntry {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
}

#[derive(Serialize)]
pub struct ProjectInfo {
    pub root: String,
    pub name: String,
}

#[derive(Serialize)]
pub struct SearchHit {
    pub path: String,
    pub line: usize,
    pub text: String,
}

fn is_binary(bytes: &[u8]) -> bool {
    bytes.iter().take(1024).any(|&b| b == 0)
}

fn walk(root: &Path, dir: &Path, out: &mut Vec<(PathBuf, String)>) {
    let Ok(reader) = fs::read_dir(dir) else {
        return;
    };
    for entry in reader.flatten() {
        let path = entry.path();
        let name = entry.file_name().to_string_lossy().to_string();
        if name.starts_with('.') || IGNORED_DIRS.contains(&name.as_str()) {
            continue;
        }
        if path.is_dir() {
            walk(root, &path, out);
        } else if let Ok(rel) = path.strip_prefix(root) {
            out.push((path.clone(), rel.to_string_lossy().replace('\\', "/")));
        }
    }
}

#[tauri::command]
pub fn search_files(
    query: String,
    include: Option<String>,
    max_results: Option<usize>,
    state: State<ProjectState>,
) -> Result<Vec<SearchHit>, String> {
    let root = project_root(&state)?;
    if query.is_empty() {
        return Err("query must not be empty".into());
    }
    let limit = max_results.unwrap_or(50).min(500);
    let mut files = Vec::new();
    walk(&root, &root, &mut files);

    let needle = query.to_lowercase();
    let mut hits: Vec<SearchHit> = Vec::new();
    for (abs, rel) in files {
        if let Some(pattern) = &include {
            if !pattern.is_empty() && !rel.contains(pattern.trim_end_matches("/**")) {
                continue;
            }
        }
        let Ok(bytes) = fs::read(&abs) else { continue };
        if is_binary(&bytes) {
            continue;
        }
        let Ok(text) = String::from_utf8(bytes) else {
            continue;
        };
        for (index, line) in text.lines().enumerate() {
            if line.to_lowercase().contains(&needle) {
                hits.push(SearchHit {
                    path: rel.clone(),
                    line: index + 1,
                    text: line.trim().chars().take(200).collect(),
                });
                if hits.len() >= limit {
                    return Ok(hits);
                }
            }
        }
    }
    Ok(hits)
}

#[tauri::command]
pub fn get_file_tree(
    max_entries: Option<usize>,
    state: State<ProjectState>,
) -> Result<Vec<String>, String> {
    let root = project_root(&state)?;
    let limit = max_entries.unwrap_or(2000).min(20000);
    let mut files = Vec::new();
    walk(&root, &root, &mut files);
    let mut paths: Vec<String> = files.into_iter().map(|(_, rel)| rel).collect();
    paths.sort();
    paths.truncate(limit);
    Ok(paths)
}


fn project_root(state: &ProjectState) -> Result<PathBuf, String> {
    state
        .root
        .lock()
        .unwrap()
        .clone()
        .ok_or_else(|| "No project opened".to_string())
}

/// Resolve a project-relative path against the root, guaranteeing the result
/// stays inside the project directory (path traversal protection).
fn resolve(root: &Path, rel: &str) -> Result<PathBuf, String> {
    let rel = rel.trim().trim_start_matches('/');
    if rel.is_empty() {
        return Ok(root.to_path_buf());
    }
    if rel.contains("..") {
        return Err("Path traversal is not allowed".into());
    }
    let p = root.join(rel);
    match p.canonicalize() {
        Ok(c) => {
            if !c.starts_with(root) {
                return Err("Path outside project root".into());
            }
            Ok(c)
        }
        // Target may not exist yet (e.g. write_file for a new file):
        // resolve the closest existing ancestor and rejoin the remainder.
        Err(_) => {
            let mut existing = p.clone();
            let mut tail: Vec<PathBuf> = Vec::new();
            while !existing.exists() {
                match (existing.parent(), existing.file_name()) {
                    (Some(parent), Some(name)) => {
                        tail.push(PathBuf::from(name));
                        existing = parent.to_path_buf();
                    }
                    _ => return Err("Invalid path".into()),
                }
            }
            let canonical = existing.canonicalize().map_err(|e| e.to_string())?;
            if !canonical.starts_with(root) {
                return Err("Path outside project root".into());
            }
            let mut result = canonical;
            for part in tail.iter().rev() {
                result = result.join(part);
            }
            Ok(result)
        }
    }
}

fn to_project_info(root: &Path) -> ProjectInfo {
    let name = root
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_else(|| root.to_string_lossy().to_string());
    ProjectInfo {
        root: root.to_string_lossy().to_string(),
        name,
    }
}

#[tauri::command]
pub fn set_project_root(path: String, state: State<ProjectState>) -> Result<ProjectInfo, String> {
    let root = fs::canonicalize(&path).map_err(|e| e.to_string())?;
    if !root.is_dir() {
        return Err("Selected path is not a directory".into());
    }
    *state.root.lock().unwrap() = Some(root.clone());
    Ok(to_project_info(&root))
}

#[tauri::command]
pub fn get_project_root(state: State<ProjectState>) -> Result<Option<ProjectInfo>, String> {
    let guard = state.root.lock().unwrap();
    Ok(guard.as_deref().map(to_project_info))
}

/// True when running on iOS/Android. Mobile has no folder picker, so the app
/// works inside a private sandbox directory instead.
#[tauri::command]
pub fn is_mobile_platform() -> bool {
    cfg!(any(target_os = "android", target_os = "ios"))
}

/// Bootstrap the sandbox workspace used on mobile and return its info.
/// Creates the directory (and a small README) if it does not exist yet.
#[tauri::command]
pub fn ensure_workspace(
    app: tauri::AppHandle,
    state: State<ProjectState>,
) -> Result<ProjectInfo, String> {
    use tauri::Manager;

    let base = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Cannot resolve app data dir: {e}"))?;
    let workspace = base.join("workspace");
    fs::create_dir_all(&workspace).map_err(|e| e.to_string())?;

    let readme = workspace.join("README.md");
    if !readme.exists() {
        let _ = fs::write(
            &readme,
            "# My App\n\nThis is your on-device workspace. Ask the AI to create files here.\n",
        );
    }

    let root = fs::canonicalize(&workspace).map_err(|e| e.to_string())?;
    *state.root.lock().unwrap() = Some(root.clone());
    Ok(to_project_info(&root))
}

#[tauri::command]
pub fn list_dir(rel: String, state: State<ProjectState>) -> Result<Vec<FileEntry>, String> {
    let root = project_root(&state)?;
    let dir = resolve(&root, &rel)?;
    let mut entries: Vec<FileEntry> = Vec::new();
    for entry in fs::read_dir(&dir).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        let name = entry.file_name().to_string_lossy().to_string();
        let is_dir = path.is_dir();
        if (is_dir && (name.starts_with('.') || IGNORED_DIRS.contains(&name.as_str())))
            || (!is_dir && name.starts_with('.') && name != ".env" && name != ".gitignore")
        {
            continue;
        }
        let rel_path = path
            .strip_prefix(&root)
            .unwrap_or(&path)
            .to_string_lossy()
            .replace('\\', "/");
        entries.push(FileEntry {
            name,
            path: rel_path,
            is_dir,
        });
    }
    entries.sort_by(|a, b| {
        b.is_dir
            .cmp(&a.is_dir)
            .then_with(|| a.name.to_lowercase().cmp(&b.name.to_lowercase()))
    });
    Ok(entries)
}

#[tauri::command]
pub fn read_file(rel: String, state: State<ProjectState>) -> Result<String, String> {
    let root = project_root(&state)?;
    let path = resolve(&root, &rel)?;
    if path.is_dir() {
        return Err("Cannot read a directory as file".into());
    }
    fs::read_to_string(&path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn write_file(rel: String, content: String, state: State<ProjectState>) -> Result<(), String> {
    let root = project_root(&state)?;
    let path = resolve(&root, &rel)?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    fs::write(&path, content).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_dir(rel: String, state: State<ProjectState>) -> Result<(), String> {
    let root = project_root(&state)?;
    let path = resolve(&root, &rel)?;
    fs::create_dir_all(&path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn rename_path(from: String, to: String, state: State<ProjectState>) -> Result<(), String> {
    let root = project_root(&state)?;
    let src = resolve(&root, &from)?;
    let dst = resolve(&root, &to)?;
    if src == root {
        return Err("Cannot rename project root".into());
    }
    fs::rename(&src, &dst).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_path(rel: String, state: State<ProjectState>) -> Result<(), String> {
    let root = project_root(&state)?;
    let path = resolve(&root, &rel)?;
    if path == root {
        return Err("Cannot delete project root".into());
    }
    if path.is_dir() {
        fs::remove_dir_all(&path).map_err(|e| e.to_string())
    } else {
        fs::remove_file(&path).map_err(|e| e.to_string())
    }
}
