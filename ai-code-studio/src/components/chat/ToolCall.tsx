import { useState } from "react";
import type { ToolCall } from "../../types/tools";
import { IconCheck, IconChevronDown, IconChevronRight } from "../ui/icons";
import { describeTool } from "./toolDisplay";

type ToolStatus = "running" | "ok" | "error";

function StatusGlyph({ status }: { status: ToolStatus }) {
  if (status === "running") {
    return (
      <span className="grid h-3.5 w-3.5 shrink-0 place-items-center">
        <span className="h-3 w-3 animate-spin-slow rounded-full border-[1.5px] border-[var(--color-border-strong)] border-t-[var(--color-accent)]" />
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="grid h-3.5 w-3.5 shrink-0 place-items-center text-[var(--color-error)]">
        <span className="text-[13px] leading-none">✕</span>
      </span>
    );
  }
  return (
    <span className="grid h-3.5 w-3.5 shrink-0 place-items-center text-[var(--color-success)]">
      <IconCheck size={11} strokeWidth={2.4} />
    </span>
  );
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

/**
 * One step in the agent activity timeline. Collapsed it reads as plain language
 * ("读取 App.tsx"); expanded it exposes the tool, input, output and duration.
 */
export function ToolCallView({
  call,
  status = "running",
  summary,
  output,
  durationMs,
}: {
  call: ToolCall;
  status?: ToolStatus;
  summary?: string;
  output?: string;
  durationMs?: number;
}) {
  const [open, setOpen] = useState(false);
  const { label, detail, icon } = describeTool(call);
  const args = JSON.stringify(call.arguments ?? {}, null, 2);

  return (
    <div className="animate-fade-in">
      <button
        className="group flex w-full items-center gap-2 rounded-[var(--radius-sm)] py-1 pr-1 text-left text-sm transition-colors hover:bg-white/[0.03]"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <StatusGlyph status={status} />
        <span className="shrink-0 text-[var(--color-text-muted)]">{icon}</span>
        <span className="shrink-0 text-[var(--color-text-secondary)]">{label}</span>
        {detail && (
          <span className="truncate font-mono text-xs text-[var(--color-text)]">
            {detail}
          </span>
        )}
        {summary && status !== "running" && (
          <span
            className={`truncate text-xs ${
              status === "error"
                ? "text-[var(--color-error)]"
                : "text-[var(--color-text-muted)]"
            }`}
          >
            · {summary}
          </span>
        )}
        {durationMs != null && status !== "running" && (
          <span className="shrink-0 text-[11px] text-[var(--color-text-disabled)]">
            {formatDuration(durationMs)}
          </span>
        )}
        <span className="ml-auto shrink-0 text-[var(--color-text-disabled)] group-hover:text-[var(--color-text-muted)]">
          {open ? <IconChevronDown size={12} /> : <IconChevronRight size={12} />}
        </span>
      </button>

      {open && (
        <div className="animate-fade-in mb-1.5 ml-[22px] overflow-hidden rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-canvas)]">
          <div className="flex items-center gap-2 border-b border-[var(--color-border-subtle)] px-2.5 py-1.5 text-[11px]">
            <span className="text-[var(--color-text-muted)]">工具</span>
            <span className="font-mono text-[var(--color-text-secondary)]">
              {call.name}
            </span>
          </div>
          <pre className="max-h-40 overflow-auto px-2.5 py-2 font-mono text-[11px] leading-relaxed text-[var(--color-text-secondary)]">
            {args}
          </pre>
          {output && (
            <pre className="max-h-56 overflow-auto border-t border-[var(--color-border-subtle)] px-2.5 py-2 font-mono text-[11px] leading-relaxed text-[var(--color-text-muted)]">
              {output}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
