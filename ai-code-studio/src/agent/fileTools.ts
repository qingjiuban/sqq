import { getFileTree, searchFiles } from "../lib/searchApi";
import { listDir, readFile, writeFile } from "../lib/api";
import { asString, type AgentTool } from "../types/tools";

function buildTree(entries: string[]): string {
  const roots = new Map<string, Set<string>>();
  for (const path of entries) {
    const parts = path.split("/");
    const file = parts.pop()!;
    const dir = parts.join("/") || ".";
    if (!roots.has(dir)) roots.set(dir, new Set());
    roots.get(dir)!.add(file);
  }
  const dirs = [...roots.keys()].sort();
  return dirs
    .map((dir) => {
      const files = [...(roots.get(dir) ?? [])].sort();
      return `${dir}/\n${files.map((f) => `  ${f}`).join("\n")}`;
    })
    .join("\n");
}

export const readFileTool: AgentTool = {
  name: "read_file",
  description:
    "Read the full UTF-8 content of a file inside the project. Path is relative to the project root.",
  permission: "read",
  inputSchema: {
    type: "object",
    properties: { path: { type: "string", description: "Project-relative file path" } },
    required: ["path"],
  },
  async execute(input) {
    const path = asString(input, "path");
    const content = await readFile(path);
    return { path, content, lines: content.split("\n").length };
  },
};

export const writeFileTool: AgentTool = {
  name: "write_file",
  description:
    "Create a new file or overwrite an existing file with the given content. Parent directories are created automatically.",
  permission: "write",
  inputSchema: {
    type: "object",
    properties: {
      path: { type: "string", description: "Project-relative file path" },
      content: { type: "string", description: "Full file content" },
    },
    required: ["path", "content"],
  },
  async execute(input) {
    const path = asString(input, "path");
    const content = typeof input.content === "string" ? input.content : "";
    await writeFile(path, content);
    return { path, bytes: content.length, written: true };
  },
};

export const editFileTool: AgentTool = {
  name: "edit_file",
  description:
    "Apply one or more exact string replacements to an existing file. Each edit replaces the first occurrence of `old` with `new`.",
  permission: "write",
  inputSchema: {
    type: "object",
    properties: {
      path: { type: "string", description: "Project-relative file path" },
      edits: {
        type: "array",
        description: "List of replacements",
        items: {
          type: "object",
          properties: { old: { type: "string" }, new: { type: "string" } },
          required: ["old", "new"],
        },
      },
    },
    required: ["path", "edits"],
  },
  async execute(input) {
    const path = asString(input, "path");
    const edits = Array.isArray(input.edits) ? input.edits : [];
    if (edits.length === 0) throw new Error("`edits` must be a non-empty array");
    let content = await readFile(path);
    const applied: number[] = [];
    edits.forEach((edit, index) => {
      const oldText = String((edit as Record<string, unknown>).old ?? "");
      const newText = String((edit as Record<string, unknown>).new ?? "");
      if (!oldText) throw new Error(`edit[${index}] is missing "old"`);
      if (!content.includes(oldText)) {
        throw new Error(`edit[${index}]: "old" text not found in ${path}`);
      }
      content = content.replace(oldText, newText);
      applied.push(index);
    });
    await writeFile(path, content);
    return { path, applied, written: true };
  },
};

export const listFilesTool: AgentTool = {
  name: "list_files",
  description: "List the entries (files and folders) of a directory in the project.",
  permission: "read",
  inputSchema: {
    type: "object",
    properties: {
      path: { type: "string", description: "Project-relative directory, use . for root" },
    },
    required: ["path"],
  },
  async execute(input) {
    const path = typeof input.path === "string" ? input.path : ".";
    const entries = await listDir(path);
    return entries.map((entry) => ({
      name: entry.name,
      path: entry.path,
      type: entry.isDir ? "dir" : "file",
    }));
  },
};

export const searchFilesTool: AgentTool = {
  name: "search_files",
  description:
    "Search for a text query across project files. Returns matching file paths, line numbers and line previews.",
  permission: "read",
  inputSchema: {
    type: "object",
    properties: {
      query: { type: "string", description: "Text to search for (case-insensitive)" },
      include: { type: "string", description: "Optional path substring filter" },
      maxResults: { type: "number", description: "Maximum number of hits" },
    },
    required: ["query"],
  },
  async execute(input) {
    const query = asString(input, "query");
    const include = typeof input.include === "string" ? input.include : undefined;
    const maxResults =
      typeof input.maxResults === "number" ? input.maxResults : undefined;
    return searchFiles(query, include, maxResults);
  },
};

export const getProjectInfoTool: AgentTool = {
  name: "get_project_info",
  description:
    "Return the project file tree (paths relative to the project root), useful to understand project structure.",
  permission: "read",
  inputSchema: {
    type: "object",
    properties: { maxEntries: { type: "number" } },
  },
  async execute(input) {
    const maxEntries =
      typeof input.maxEntries === "number" ? input.maxEntries : undefined;
    const tree = await getFileTree(maxEntries);
    return { count: tree.length, tree: buildTree(tree) };
  },
};
