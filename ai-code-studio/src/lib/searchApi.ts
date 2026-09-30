import { invoke } from "@tauri-apps/api/core";
import { isTauri } from "../lib/tauri";

export interface SearchHit {
  path: string;
  line: number;
  text: string;
}

export function searchFiles(
  query: string,
  include?: string,
  maxResults?: number,
): Promise<SearchHit[]> {
  return invoke<SearchHit[]>("search_files", {
    query,
    include: include ?? null,
    maxResults: maxResults ?? null,
  });
}

export function getFileTree(maxEntries?: number): Promise<string[]> {
  return invoke<string[]>("get_file_tree", { maxEntries: maxEntries ?? null });
}

export function canSearch(): boolean {
  return isTauri();
}
