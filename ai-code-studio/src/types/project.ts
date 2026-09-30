export interface FileEntry {
  name: string;
  path: string;
  isDir: boolean;
}

export interface ProjectInfo {
  root: string;
  name: string;
}

export interface OpenTab {
  path: string;
  content: string;
  dirty: boolean;
}
