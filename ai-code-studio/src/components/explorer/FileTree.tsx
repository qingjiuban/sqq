import { useProjectStore } from "../../store/projectStore";
import type { FileEntry } from "../../types/project";

interface FileTreeProps {
  dirPath: string;
  depth: number;
}

function FileGlyph({ entry, open }: { entry: FileEntry; open: boolean }) {
  if (entry.isDir) {
    return (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <path
          d={
            open
              ? "M2 4.2A1.2 1.2 0 0 1 3.2 3h2.4l1.2 1.5h5.9A1.2 1.2 0 0 1 13.9 5.7v.8H5.3L3 12.6V4.2Z"
              : "M2 4.2A1.2 1.2 0 0 1 3.2 3h2.4l1.2 1.5h6A1.2 1.2 0 0 1 14 5.7v5.1a1.2 1.2 0 0 1-1.2 1.2H3.2A1.2 1.2 0 0 1 2 10.8V4.2Z"
          }
          stroke="currentColor"
          strokeWidth="1.2"
        />
        {open && (
          <path d="M3 12.6 5.3 6.5h9.1L12.1 12.6H3Z" stroke="currentColor" strokeWidth="1.2" />
        )}
      </svg>
    );
  }
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path
        d="M4 2.5h5L12.5 6v7.5H4V2.5Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path d="M9 2.5V6h3.5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function TreeNode({ entry, depth }: { entry: FileEntry; depth: number }) {
  const { expanded, activePath, toggleDir, openFile, deleteEntry } =
    useProjectStore();
  const isOpen = !!expanded[entry.path];
  const isActive = activePath === entry.path;

  const handleClick = () => {
    if (entry.isDir) {
      toggleDir(entry.path);
    } else {
      openFile(entry.path);
    }
  };

  return (
    <div>
      <div
        className={`group flex cursor-pointer items-center gap-1.5 py-1 pr-2 text-[12.5px] select-none ${
          isActive
            ? "bg-[var(--color-iris-deep)]/70 text-[#d6d0ff]"
            : "text-[var(--color-dim)] hover:bg-white/[0.04] hover:text-[var(--color-fg)]"
        }`}
        style={{ paddingLeft: `${depth * 13 + 10}px` }}
        onClick={handleClick}
        onContextMenu={(e) => {
          e.preventDefault();
          if (window.confirm(`Delete "${entry.name}"?`)) deleteEntry(entry.path);
        }}
        title={entry.path}
      >
        {entry.isDir ? (
          <svg
            width="9"
            height="9"
            viewBox="0 0 10 10"
            className={`shrink-0 text-[var(--color-mute)] transition-transform ${
              isOpen ? "rotate-90" : ""
            }`}
          >
            <path d="M3 1.5 6.5 5 3 8.5" stroke="currentColor" strokeWidth="1.4" fill="none" />
          </svg>
        ) : (
          <span className="w-[9px] shrink-0" />
        )}
        <span
          className={
            entry.isDir
              ? "text-[var(--color-iris-hi)]"
              : isActive
                ? "text-[#c9c2ff]"
                : "text-[var(--color-mute)]"
          }
        >
          <FileGlyph entry={entry} open={isOpen} />
        </span>
        <span className="truncate">{entry.name}</span>
      </div>
      {entry.isDir && isOpen && <FileTree dirPath={entry.path} depth={depth + 1} />}
    </div>
  );
}

export default function FileTree({ dirPath, depth }: FileTreeProps) {
  const dirs = useProjectStore((s) => s.dirs);
  const entries = dirs[dirPath];

  if (!entries) {
    return (
      <div
        className="py-1 text-[12px] text-[var(--color-mute)]"
        style={{ paddingLeft: `${depth * 13 + 26}px` }}
      >
        loading…
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div
        className="py-1 text-[12px] text-[var(--color-mute)]"
        style={{ paddingLeft: `${depth * 13 + 26}px` }}
      >
        empty
      </div>
    );
  }

  return (
    <div>
      {entries.map((entry) => (
        <TreeNode key={entry.path} entry={entry} depth={depth} />
      ))}
    </div>
  );
}
