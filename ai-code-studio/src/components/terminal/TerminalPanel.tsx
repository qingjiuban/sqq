import { useTerminalStore } from "../../store/terminalStore";
import {
  IconChevronDown,
  IconChevronRight,
  IconTerminal,
} from "../ui/icons";
import { StatusDot } from "../ui/Status";

function statusOf(entry: {
  running: boolean;
  timedOut: boolean;
  exitCode: number | null;
}): {
  text: string;
  tone: "accent" | "ok" | "warn" | "err";
  chip: string;
} {
  if (entry.running)
    return { text: "运行中", tone: "accent", chip: "chip chip-accent" };
  if (entry.timedOut)
    return { text: "已超时", tone: "warn", chip: "chip chip-warn" };
  if (entry.exitCode === 0)
    return { text: "成功", tone: "ok", chip: "chip chip-ok" };
  return {
    text: `退出码 ${entry.exitCode ?? "?"}`,
    tone: "err",
    chip: "chip chip-err",
  };
}

function formatTime(at: number): string {
  return new Date(at).toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/**
 * Terminal workspace. Collapsed it is a quiet status bar; expanded it shows the
 * command, its output and exit state as an ordered log, not a styled card.
 */
export default function TerminalPanel() {
  const { entries, visible, toggle, clear } = useTerminalStore();
  const runningCount = entries.filter((e) => e.running).length;

  if (!visible) {
    return (
      <button
        className="flex h-8 shrink-0 items-center gap-2 border-t border-[var(--color-border-subtle)] bg-[var(--color-surface)] px-3 text-xs text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-secondary)]"
        onClick={toggle}
      >
        <IconChevronRight size={13} />
        <IconTerminal size={14} />
        <span className="font-medium">终端</span>
        {runningCount > 0 && <StatusDot tone="accent" pulse />}
        {entries.length > 0 && <span className="chip ml-0.5">{entries.length}</span>}
      </button>
    );
  }

  return (
    <div className="flex h-64 shrink-0 flex-col border-t border-[var(--color-border-subtle)] bg-[var(--color-canvas)]">
      <div className="flex h-8 shrink-0 items-center justify-between border-b border-[var(--color-border-subtle)] bg-[var(--color-surface)] px-3">
        <button
          className="flex items-center gap-2 text-xs font-medium text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text)]"
          onClick={toggle}
        >
          <IconChevronDown size={13} />
          <IconTerminal size={14} />
          终端
          {entries.length > 0 && <span className="chip ml-0.5">{entries.length}</span>}
          {runningCount > 0 && (
            <span className="flex items-center gap-1.5 text-[11px] text-[var(--color-accent-hover)]">
              <StatusDot tone="accent" pulse />
              {runningCount} 个运行中
            </span>
          )}
        </button>
        <div className="flex items-center gap-1">
          <button
            className="btn btn-ghost !h-6 !px-2"
            onClick={clear}
            disabled={entries.length === 0}
          >
            清空
          </button>
          <button className="btn btn-ghost !h-6 !px-2" onClick={toggle}>
            隐藏
          </button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-3 font-mono text-xs leading-relaxed">
        {entries.length === 0 && (
          <div className="text-[var(--color-text-disabled)]">
            智能体运行的命令将显示在这里。
          </div>
        )}
        {entries.map((entry) => {
          const status = statusOf(entry);
          return (
            <div key={entry.id} className="mb-3">
              <div className="flex items-center gap-2">
                <span className="shrink-0 text-[var(--color-text-disabled)]">
                  {formatTime(entry.at)}
                </span>
                <span className="text-[var(--color-accent)]">$</span>
                <span className="min-w-0 flex-1 truncate text-[var(--color-text)]">
                  {entry.command}
                </span>
                <span className={`${status.chip} shrink-0`}>
                  <StatusDot tone={status.tone} pulse={entry.running} />
                  {status.text}
                </span>
              </div>
              {entry.output.trim() && (
                <pre className="mt-1 whitespace-pre-wrap break-all pl-3 text-[var(--color-text-secondary)]">
                  {entry.output.trimEnd()}
                </pre>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
