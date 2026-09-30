import { useProjectStore } from "../../store/projectStore";
import FileTree from "../explorer/FileTree";
import {
  IconClose,
  IconFolderPlus,
  IconPlus,
  IconRefresh,
} from "../ui/icons";

/**
 * Workspace explorer. Identity on top, then the file tree, then a compact
 * list of open editors when there are any.
 */
export default function Sidebar({ embedded = false }: { embedded?: boolean }) {
  const {
    projectName,
    createFile,
    createFolder,
    refreshTree,
    tabs,
    activePath,
    setActiveTab,
    closeTab,
  } = useProjectStore();

  return (
    <aside
      className={
        embedded
          ? "flex h-full w-full flex-col bg-[var(--color-panel)]"
          : "flex h-full w-64 shrink-0 flex-col border-r border-[var(--color-line-soft)] bg-[var(--color-panel)]"
      }
    >
      <div className="flex h-11 shrink-0 items-center justify-between gap-2 px-3">
        <div className="flex min-w-0 flex-col">
          <span className="eyebrow">Project</span>
          <span
            className="truncate text-sm font-medium text-[var(--color-fg)]"
            title={projectName}
          >
            {projectName || "Explorer"}
          </span>
        </div>
        <div className="flex shrink-0 items-center">
          <button
            className="btn-icon"
            onClick={() => createFile(".")}
            title="New file"
            aria-label="New file"
          >
            <IconPlus size={15} />
          </button>
          <button
            className="btn-icon"
            onClick={() => createFolder(".")}
            title="New folder"
            aria-label="New folder"
          >
            <IconFolderPlus size={15} />
          </button>
          <button
            className="btn-icon"
            onClick={refreshTree}
            title="Refresh"
            aria-label="Refresh"
          >
            <IconRefresh size={15} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-3">
        <div className="px-3 pb-1">
          <span className="eyebrow">Files</span>
        </div>
        <FileTree dirPath="." depth={0} />

        {tabs.length > 0 && (
          <div className="mt-3 border-t border-[var(--color-line-soft)] pt-2">
            <div className="px-3 pb-1">
              <span className="eyebrow">Open</span>
            </div>
            {tabs.map((tab) => {
              const active = tab.path === activePath;
              return (
                <div
                  key={tab.path}
                  className={`group flex cursor-pointer items-center gap-2 py-1 pl-3 pr-2 text-sm transition-colors ${
                    active
                      ? "bg-[var(--color-raised)] text-[var(--color-fg)]"
                      : "text-[var(--color-dim)] hover:bg-white/[0.03]"
                  }`}
                  onClick={() => setActiveTab(tab.path)}
                  title={tab.path}
                >
                  <span className="truncate">{tab.path.split("/").pop()}</span>
                  {tab.dirty ? (
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-iris-hi)]" />
                  ) : null}
                  <button
                    className="ml-auto hidden rounded p-0.5 text-[var(--color-mute)] group-hover:block hover:text-[var(--color-fg)]"
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTab(tab.path);
                    }}
                    aria-label={`Close ${tab.path}`}
                  >
                    <IconClose size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
