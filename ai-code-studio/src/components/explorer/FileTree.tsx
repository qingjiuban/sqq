import { useProjectStore } from "../../store/projectStore";
import type { FileEntry } from "../../types/project";
import { FileGlyph, FolderGlyph } from "../ui/fileIcon";
import { IconChevronRight } from "../ui/icons";

interface FileTreeProps {
  dirPath: string;
  depth: number;
}

/**
 * A tree row. Selection is expressed with a left accent indicator plus a
 * subtle surface, not a saturated block.
 */
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
        className={`group relative flex cursor-pointer items-center gap-1.5 py-[3px] pr-2 text-sm transition-colors ${
          isActive
            ? "bg-[var(--color-raised)] text-[var(--color-fg)]"
            : "text-[var(--color-dim)] hover:bg-white/[0.03] hover:text-[var(--color-fg)]"
        }`}
        style={{ paddingLeft: `${depth * 14 + 10}px` }}
        onClick={handleClick}
        onContextMenu={(e) => {
          e.preventDefault();
          if (window.confirm(`确定删除 "${entry.name}" 吗？`)) deleteEntry(entry.path);
        }}
        title={entry.path}
      >
        {isActive && (
          <span className="absolute inset-y-[3px] left-0 w-[2px] rounded-r bg-[var(--color-iris-hi)]" />
        )}
        {entry.isDir ? (
          <IconChevronRight
            size={11}
            className={`shrink-0 text-[var(--color-mute)] transition-transform duration-150 ${
              isOpen ? "rotate-90" : ""
            }`}
          />
        ) : (
          <span className="w-[11px] shrink-0" />
        )}
        <span
          className={`shrink-0 ${
            entry.isDir ? "text-[var(--color-iris-hi)]" : ""
          }`}
        >
          {entry.isDir ? <FolderGlyph open={isOpen} /> : <FileGlyph entry={entry} />}
        </span>
        <span className="truncate">{entry.name}</span>
      </div>
      {entry.isDir && isOpen && (
        <FileTree dirPath={entry.path} depth={depth + 1} />
      )}
    </div>
  );
}

export default function FileTree({ dirPath, depth }: FileTreeProps) {
  const dirs = useProjectStore((s) => s.dirs);
  const entries = dirs[dirPath];

  if (!entries) {
    return (
      <div
        className="py-1 text-sm text-[var(--color-faint)]"
        style={{ paddingLeft: `${depth * 14 + 27}px` }}
      >
        加载中…
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div
        className="py-1 text-sm text-[var(--color-faint)]"
        style={{ paddingLeft: `${depth * 14 + 27}px` }}
      >
        空文件夹
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
