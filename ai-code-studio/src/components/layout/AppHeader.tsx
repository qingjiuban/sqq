import { useModelStore } from "../../store/modelStore";
import { BrandMark, IconSettings, IconTerminal } from "../ui/icons";

export type ViewMode = "editor" | "preview";

/**
 * Two-option segmented switch. The active option is marked by a raised surface,
 * not a colored block, so the accent stays reserved for state.
 */
export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div
      role="tablist"
      className="flex items-center gap-0.5 rounded-[var(--radius-btn)] bg-[var(--color-canvas)] p-0.5"
    >
      {options.map((option) => {
        const active = value === option.value;
        return (
          <button
            key={option.value}
            role="tab"
            aria-selected={active}
            className={`rounded-[5px] px-3 py-1 text-sm font-medium transition-colors ${
              active
                ? "bg-[var(--color-surface-hover)] text-[var(--color-text)]"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
            }`}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/** Application chrome: brand, project identity, view switch and global actions. */
export default function AppHeader({
  root,
  projectName,
  view,
  onViewChange,
  onToggleTerminal,
  terminalCount,
  onOpenSettings,
  onOpenProject,
}: {
  root: boolean;
  projectName: string;
  view: ViewMode;
  onViewChange: (view: ViewMode) => void;
  onToggleTerminal: () => void;
  terminalCount: number;
  onOpenSettings: () => void;
  onOpenProject: () => void;
}) {
  const { providers, activeId } = useModelStore();
  const activeModel = providers.find((p) => p.id === activeId)?.model ?? null;

  return (
    <header className="flex h-[46px] shrink-0 items-center gap-3 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface)] pl-3 pr-2">
      {/* Brand + project identity */}
      <div className="flex min-w-0 items-center gap-2.5">
        <BrandMark size={20} />
        <span className="shrink-0 text-sm font-semibold tracking-tight">
          AI Code Studio
        </span>
        {root && (
          <>
            <span className="h-3.5 w-px shrink-0 bg-[var(--color-border)]" />
            <span
              className="max-w-56 truncate text-sm text-[var(--color-text-secondary)]"
              title={projectName}
            >
              {projectName || "未命名"}
            </span>
            {activeModel && (
              <span className="chip max-w-40 shrink-0">
                <span className="truncate">{activeModel}</span>
              </span>
            )}
          </>
        )}
      </div>

      {/* Center: primary view switch */}
      <div className="flex flex-1 justify-center">
        {root && (
          <SegmentedControl
            value={view}
            onChange={onViewChange}
            options={[
              { value: "editor", label: "编辑器" },
              { value: "preview", label: "预览" },
            ]}
          />
        )}
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1">
        <button
          className="btn-icon relative"
          onClick={onToggleTerminal}
          title="终端"
          aria-label="终端"
        >
          <IconTerminal />
          {terminalCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid h-3.5 min-w-3.5 place-items-center rounded-full bg-[var(--color-accent)] px-1 text-[9px] font-medium text-white">
              {terminalCount}
            </span>
          )}
        </button>
        <button
          className="btn-icon"
          onClick={onOpenSettings}
          title="设置"
          aria-label="设置"
        >
          <IconSettings />
        </button>
        <span className="mx-1 h-3.5 w-px bg-[var(--color-border)]" />
        <button className="btn btn-primary" onClick={onOpenProject}>
          {root ? "切换项目" : "打开项目"}
        </button>
      </div>
    </header>
  );
}
