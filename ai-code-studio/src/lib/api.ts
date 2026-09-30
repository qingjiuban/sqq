import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import type { FileEntry, ProjectInfo } from "../types/project";

export async function pickProjectFolder(): Promise<string | null> {
  const selected = await open({ directory: true, multiple: false });
  return typeof selected === "string" ? selected : null;
}

export function setProjectRoot(path: string): Promise<ProjectInfo> {
  return invoke<ProjectInfo>("set_project_root", { path });
}

export function getProjectRoot(): Promise<ProjectInfo | null> {
  return invoke<ProjectInfo | null>("get_project_root");
}

export function isMobilePlatform(): Promise<boolean> {
  return invoke<boolean>("is_mobile_platform");
}

export function ensureWorkspace(): Promise<ProjectInfo> {
  return invoke<ProjectInfo>("ensure_workspace");
}

export function listDir(path: string): Promise<FileEntry[]> {
  return invoke<FileEntry[]>("list_dir", { rel: path });
}

export function readFile(path: string): Promise<string> {
  return invoke<string>("read_file", { rel: path });
}

export function writeFile(path: string, content: string): Promise<void> {
  return invoke<void>("write_file", { rel: path, content });
}

export function createDir(path: string): Promise<void> {
  return invoke<void>("create_dir", { rel: path });
}

export function renamePath(from: string, to: string): Promise<void> {
  return invoke<void>("rename_path", { from, to });
}

export function deletePath(path: string): Promise<void> {
  return invoke<void>("delete_path", { rel: path });
}

export function languageFromPath(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    ts: "typescript",
    tsx: "typescript",
    js: "javascript",
    jsx: "javascript",
    mjs: "javascript",
    cjs: "javascript",
    json: "json",
    css: "css",
    scss: "scss",
    less: "less",
    html: "html",
    md: "markdown",
    rs: "rust",
    py: "python",
    go: "go",
    yml: "yaml",
    yaml: "yaml",
    toml: "ini",
    sh: "shell",
    sql: "sql",
    xml: "xml",
    svg: "xml",
  };
  return map[ext] ?? "plaintext";
}
