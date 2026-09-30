import { useEffect, useRef } from "react";
import { useTerminalStore } from "../../store/terminalStore";

function statusOf(entry: {
  running: boolean;
  timedOut: boolean;
  exitCode: number | null;
}): { text: string; className: string } {
  if (entry.running) return { text: "running", className: "text-[var(--color-iris-hi)]" };
  if (entry.timedOut) return { text: "timed out", className: "text-[var(--color-warn)]" };
  if (entry.exitCode === 0) return { text: "exit 0", className: "text-[var(--color-ok)]" };
  return {
    text: `exit ${entry.exitCode ?? "?"}`,
    className: "text-[var(--color-err)]",
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
        className="flex h-8 shrink-0 items-center gap-2 border-t border-[var(--color-line-soft)] bg-[var(--color-panel)] px-3 text-[11px] text-[var(--color-mute)] transition-colors hover:text-[var(--color-dim)]"
        onClick={toggle}
      >
        <span className="font-medium">Terminal</span>
        <span className="rounded-full bg-white/5 px-1.5 text-[10px]">
          {entries.length}
        </span>
      </button>
    );
  }

  return (
    <div className="flex h-64 shrink-0 flex-col border-t border-[var(--color-line-soft)] bg-[#08090d]">
      <div className="flex h-8 shrink-0 items-center justify-between border-b border-[var(--color-line-soft)] px-3">
        <span className="panel-title">Terminal</span>
        <div className="flex items-center gap-1">
          <button className="btn btn-ghost !px-2 !py-0.5" onClick={clear}>
            Clear
          </button>
          <button className="btn btn-ghost !px-2 !py-0.5" onClick={toggle}>
            Hide
          </button>
        </div>
      </div>
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto p-3 font-mono text-[11.5px] leading-relaxed"
      >
        {entries.length === 0 && (
          <div className="text-[var(--color-mute)]">
            Commands run by the agent will appear here.
          </div>
        )}
        {entries.map((entry) => {
          const status = statusOf(entry);
          return (
            <div key={entry.id} className="mb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-[var(--color-iris-hi)]">$</span>
                <span className="text-[var(--color-fg)]">{entry.command}</span>
                <span className={status.className}>[{status.text}]</span>
              </div>
              {entry.output.trim() && (
                <pre className="mt-0.5 whitespace-pre-wrap break-all text-[var(--color-dim)]">
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
