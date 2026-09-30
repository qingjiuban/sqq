import { useProjectStore } from "../../store/projectStore";
import { IconClose } from "../ui/icons";
import { fileTint } from "../ui/fileIcon";

/**
 * Editor chrome tabs. The active tab is lifted onto the editor surface and
 * marked with a thin top accent; inactive tabs recede.
 */
export default function EditorTabs() {
  const { tabs, activePath, setActiveTab, closeTab } = useProjectStore();

  if (tabs.length === 0) return null;

  return (
    <div className="flex h-9 shrink-0 items-stretch overflow-x-auto border-b border-[var(--color-line-soft)] bg-[var(--color-panel)]">
      {tabs.map((tab) => {
        const active = tab.path === activePath;
        const name = tab.path.split("/").pop() ?? tab.path;
        const tint = fileTint(name);
        return (
          <div
            key={tab.path}
            className={`group relative flex max-w-52 shrink-0 cursor-pointer items-center gap-2 border-r border-[var(--color-line-soft)] px-3 text-sm transition-colors ${
              active
                ? "bg-[var(--color-ink)] text-[var(--color-fg)]"
                : "text-[var(--color-mute)] hover:bg-white/[0.02] hover:text-[var(--color-dim)]"
            }`}
            onClick={() => setActiveTab(tab.path)}
          >
            {active && (
              <span className="absolute inset-x-0 top-0 h-[2px] bg-[var(--color-iris)]" />
            )}
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ background: tint ?? "var(--color-faint)" }}
            />
            <span className="truncate">{name}</span>
            {tab.dirty ? (
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-iris-hi)]" />
            ) : null}
            <button
              className="ml-0.5 hidden rounded p-0.5 text-[var(--color-mute)] group-hover:block hover:text-[var(--color-fg)]"
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
  );
}
