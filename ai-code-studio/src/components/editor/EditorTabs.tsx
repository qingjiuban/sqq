import { useProjectStore } from "../../store/projectStore";
import { IconClose } from "../ui/icons";
import { fileTint } from "../ui/fileIcon";

/**
 * Editor chrome: a tab strip plus a lightweight breadcrumb for the active file.
 * The active tab is lifted onto the editor surface and marked with a thin top
 * accent; inactive tabs recede. Modified files show a small dot.
 */
export default function EditorTabs() {
  const { tabs, activePath, setActiveTab, closeTab } = useProjectStore();

  if (tabs.length === 0) return null;

  const activeTab = tabs.find((t) => t.path === activePath) ?? null;
  const segments = activeTab ? activeTab.path.split("/").filter(Boolean) : [];

  return (
    <div className="shrink-0 bg-[var(--color-surface)]">
      <div className="flex h-9 items-stretch overflow-x-auto">
        {tabs.map((tab) => {
          const active = tab.path === activePath;
          const name = tab.path.split("/").pop() ?? tab.path;
          const tint = fileTint(name);
          return (
            <div
              key={tab.path}
              className={`group relative flex max-w-52 shrink-0 cursor-pointer items-center gap-2 border-r border-[var(--color-border-subtle)] px-3 text-sm transition-colors ${
                active
                  ? "bg-[var(--color-canvas)] text-[var(--color-text)]"
                  : "text-[var(--color-text-muted)] hover:bg-white/[0.02] hover:text-[var(--color-text-secondary)]"
              }`}
              onClick={() => setActiveTab(tab.path)}
            >
              {active && (
                <span className="absolute inset-x-0 top-0 h-[2px] bg-[var(--color-accent)]" />
              )}
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ background: tint ?? "var(--color-text-disabled)" }}
              />
              <span className="truncate">{name}</span>
              {tab.dirty ? (
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-accent-hover)]" />
              ) : null}
              <button
                className="ml-0.5 hidden rounded p-0.5 text-[var(--color-text-muted)] group-hover:block hover:text-[var(--color-text)]"
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tab.path);
                }}
                aria-label={`关闭 ${name}`}
              >
                <IconClose size={12} />
              </button>
            </div>
          );
        })}
      </div>

      {segments.length > 0 && (
        <div className="flex h-7 items-center gap-1.5 border-t border-[var(--color-border-subtle)] px-3 text-xs text-[var(--color-text-muted)]">
          {segments.map((segment, index) => {
            const last = index === segments.length - 1;
            return (
              <span key={`${segment}-${index}`} className="flex items-center gap-1.5">
                {index > 0 && (
                  <span className="text-[var(--color-text-disabled)]">/</span>
                )}
                <span className={last ? "text-[var(--color-text-secondary)]" : ""}>
                  {segment}
                </span>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
