import type { FileEntry } from "../../types/project";

/**
 * Subtle per-language tinting for file icons. Deliberately desaturated so the
 * tree stays calm; the hue only hints at the file type.
 */
const EXT_COLORS: Record<string, string> = {
  ts: "#5aa9f5",
  tsx: "#5aa9f5",
  js: "#e6c15a",
  jsx: "#e6c15a",
  mjs: "#e6c15a",
  cjs: "#e6c15a",
  css: "#6fc3ff",
  scss: "#6fc3ff",
  less: "#6fc3ff",
  html: "#f0806a",
  htm: "#f0806a",
  json: "#e6c15a",
  md: "#9aa4b8",
  mdx: "#9aa4b8",
  rs: "#e0956a",
  py: "#6fc3ff",
  go: "#6fd0d6",
  java: "#e0956a",
  kt: "#b28bf0",
  rb: "#e0707a",
  php: "#9aa4b8",
  sh: "#7fd6a8",
  bash: "#7fd6a8",
  zsh: "#7fd6a8",
  toml: "#9aa4b8",
  yml: "#c98bf0",
  yaml: "#c98bf0",
  svg: "#e6b04a",
  png: "#e6b04a",
  jpg: "#e6b04a",
  jpeg: "#e6b04a",
  gif: "#e6b04a",
  webp: "#e6b04a",
  ico: "#e6b04a",
  lock: "#666d7c",
};

function extOf(name: string): string {
  const dot = name.lastIndexOf(".");
  if (dot <= 0 || dot === name.length - 1) return "";
  return name.slice(dot + 1).toLowerCase();
}

export function fileTint(name: string): string | undefined {
  return EXT_COLORS[extOf(name)];
}

/** Document glyph used for files. */
export function FileGlyph({ entry }: { entry: FileEntry }) {
  const tint = fileTint(entry.name);
  const color = tint ?? "var(--color-mute)";
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 16 16"
      fill="none"
      stroke={color}
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 2.4h5L12.4 5.8v7.8H4V2.4Z" />
      <path d="M8.9 2.4v3.5h3.5" />
    </svg>
  );
}

/** Folder glyph. Open state swaps to the splayed shape. */
export function FolderGlyph({ open }: { open: boolean }) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {open ? (
        <>
          <path d="M2 5.2A1.2 1.2 0 0 1 3.2 4h2.3l1.2 1.5h5.9a1.2 1.2 0 0 1 1.2 1.2v.6H5.4L3 12.6V5.2Z" />
          <path d="M3 12.6 5.4 7.3h9.2L12.2 12.6H3Z" />
        </>
      ) : (
        <path d="M2 5.2A1.2 1.2 0 0 1 3.2 4h2.3l1.2 1.5h6a1.2 1.2 0 0 1 1.2 1.2v4.6a1.2 1.2 0 0 1-1.2 1.2H3.2A1.2 1.2 0 0 1 2 11.3V5.2Z" />
      )}
    </svg>
  );
}
