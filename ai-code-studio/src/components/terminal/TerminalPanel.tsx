import { useEffect, useRef } from "react";
import { useTerminalStore } from "../../store/terminalStore";
import { IconChevronDown, IconChevronRight, IconTerminal } from "../ui/icons";
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
    return { text: "Running", tone: "accent", chip: "chip chip-accent" };
  if (entry.timedOut)
    return { text: "Timed out", tone: "warn", chip: "chip chip-warn" };
  if (entry.exitCode === 0)
    return { text: "Success", tone: "ok", chip: "chip chip-ok" };
  return {
    text: `Exit ${entry.exitCode ?? "?"}`,
    tone: "err",
    chip: "chip chip-err",
  };
}

export default function TerminalPanel() {
  const { entries, visible, toggle, clear } = useTerminalStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = scrollRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [entries, visible]);

  if (!visible) {
    return (
      <button
        className="flex h-9 shrink-0 items-center gap-2 border-t border-[var(--color-line-soft)] bg-[var(--color-panel)] px-3 text-xs text-[var(--color-mute)] transition-colors hover:text-[var(--color-dim)]"
        onClick={toggle}
      >
        <IconChevronRight size={13} />
        <IconTerminal size={14} />
        <span className="font-medium">Terminal</span>
        {entries.length > 0 && (
          <span className="chip ml-0.5">{entries.length}</span>
        )}
      </button>
    );
  }

  return (
    <div className="flex h-64 shrink-0 flex-col border-t border-[var(--color-line-soft)] bg-[var(--color-ink)]">
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-[var(--color-line-soft)] bg-[var(--color-panel)] px-3">
        <button
          className="flex items-center gap-2 text-xs font-medium text-[var(--color-dim)] transition-colors hover:text-[var(--color-fg)]"
          onClick={toggle}
        >
          <IconChevronDown size={13} />
          <IconTerminal size={14} />
          Terminal
          {entries.length > 0 && (
            <span className="chip ml-0.5">{entries.length}</span>
          )}
        </button>
        <div className="flex items-center gap-1">
          <button className="btn btn-ghost !h-7" onClick={clear}>
            Clear
          </button>
          <button className="btn btn-ghost !h-7" onClick={toggle}>
            Hide
          </button>
        </div>
      </div>
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto p-3 font-mono text-xs leading-relaxed"
      >
        {entries.length === 0 && (
          <div className="text-[var(--color-faint)]">
            Commands the agent runs will appear here.
          </div>
        )}
        {entries.map((entry) => {
          const status = statusOf(entry);
          return (
            <div key={entry.id} className="mb-3">
              <div className="flex items-center gap-2">
                <span className="text-[var(--color-iris-hi)]">$</span>
                <span className="text-[var(--color-fg)]">{entry.command}</span>
                <span className={status.chip}>
                  <StatusDot tone={status.tone} pulse={entry.running} />
                  {status.text}
                </span>
              </div>
              {entry.output.trim() && (
                <pre className="mt-1 whitespace-pre-wrap break-all pl-3 text-[var(--color-dim)]">
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
