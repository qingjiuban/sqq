import { useProjectStore } from "../../store/projectStore";

export default function EditorTabs() {
  const { tabs, activePath, setActiveTab, closeTab } = useProjectStore();

  if (tabs.length === 0) return null;

  return (
    <div className="flex h-9 shrink-0 items-stretch border-b border-[var(--color-line-soft)] bg-[var(--color-panel)]">
      {tabs.map((tab) => {
        const active = tab.path === activePath;
        return (
          <div
            key={tab.path}
            className={`group relative flex max-w-52 cursor-pointer items-center gap-2 border-r border-[var(--color-line-soft)] px-3 text-[12px] transition-colors ${
              active
                ? "bg-[var(--color-ink)] text-[var(--color-fg)]"
                : "text-[var(--color-mute)] hover:bg-white/[0.03] hover:text-[var(--color-dim)]"
            }`}
            onClick={() => setActiveTab(tab.path)}
          >
            {active && (
              <span className="absolute inset-x-0 top-0 h-[2px] bg-[var(--color-iris-hi)]" />
            )}
            <span className="truncate">{tab.path.split("/").pop()}</span>
            {tab.dirty ? (
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-iris-hi)]" />
            ) : null}
            <button
              className="ml-0.5 hidden rounded px-1 text-[var(--color-mute)] group-hover:block hover:bg-white/10 hover:text-[var(--color-fg)]"
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab.path);
              }}
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}
