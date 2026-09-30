import { useProjectStore } from "../../store/projectStore";
import FileTree from "../explorer/FileTree";
import {
  IconClose,
  IconFolderPlus,
  IconPlus,
  IconRefresh,
} from "../ui/icons";

/**
 * Project explorer. Identity on top, then the file tree, then the list of open
 * editors. No invented sections — only what the project actually contains.
 */
export default function Sidebar({ embedded = false }: { embedded?: boolean }) {
  const {
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
          ? "flex h-full w-full flex-col bg-[var(--color-surface)]"
          : "flex h-full w-64 shrink-0 flex-col border-r border-[var(--color-border-subtle)] bg-[var(--color-surface)]"
      }
    >
      <div className="flex h-10 shrink-0 items-center justify-between gap-2 px-3">
        <div className="flex min-w-0 items-baseline gap-2">
          <span className="shrink-0 text-xs font-semibold text-[var(--color-text-secondary)]">
            资源管理器
          </span>
        </div>
        <div className="flex shrink-0 items-center">
          <button
            className="btn-icon"
            onClick={() => createFile(".")}
            title="新建文件"
            aria-label="新建文件"
          >
            <IconPlus size={15} />
          </button>
          <button
            className="btn-icon"
            onClick={() => createFolder(".")}
            title="新建文件夹"
            aria-label="新建文件夹"
          >
            <IconFolderPlus size={15} />
          </button>
          <button
            className="btn-icon"
            onClick={refreshTree}
            title="刷新"
            aria-label="刷新"
          >
            <IconRefresh size={15} />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pb-3">
        <FileTree dirPath="." depth={0} />

        {tabs.length > 0 && (
          <div className="mt-3 border-t border-[var(--color-border-subtle)] pt-2">
            <div className="px-3 pb-1">
              <span className="text-[11px] font-medium text-[var(--color-text-muted)]">
                已打开
              </span>
            </div>
            {tabs.map((tab) => {
              const active = tab.path === activePath;
              return (
                <div
                  key={tab.path}
                  className={`group relative flex cursor-pointer items-center gap-2 py-1 pl-3 pr-2 text-sm transition-colors ${
                    active
                      ? "bg-[var(--color-surface-raised)] text-[var(--color-text)]"
                      : "text-[var(--color-text-secondary)] hover:bg-white/[0.03]"
                  }`}
                  onClick={() => setActiveTab(tab.path)}
                  title={tab.path}
                >
                  {active && (
                    <span className="absolute inset-y-[3px] left-0 w-[2px] rounded-r bg-[var(--color-accent)]" />
                  )}
                  <span className="truncate">{tab.path.split("/").pop()}</span>
                  {tab.dirty ? (
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-accent-hover)]" />
                  ) : null}
                  <button
                    className="ml-auto hidden rounded p-0.5 text-[var(--color-text-muted)] group-hover:block hover:text-[var(--color-text)]"
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTab(tab.path);
                    }}
                    aria-label={`关闭 ${tab.path}`}
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
