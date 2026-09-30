import { useState } from "react";
import type { ToolCall } from "../../types/tools";
import { IconChevronDown, IconChevronRight } from "../ui/icons";
import { StatusDot } from "../ui/Status";
import { describeTool } from "./toolDisplay";

/**
 * One row in the agent activity timeline. Collapsed by default: the user sees
 * what happened in plain language, and can expand for raw arguments.
 */
export function ToolCallView({
  call,
  status = "running",
  summary,
}: {
  call: ToolCall;
  status?: "running" | "ok" | "error";
  summary?: string;
}) {
  const [open, setOpen] = useState(false);
  const { label, detail, icon } = describeTool(call);
  const args = JSON.stringify(call.arguments ?? {}, null, 2);

  const tone =
    status === "running" ? "accent" : status === "error" ? "err" : "ok";

  return (
    <div className="animate-fade-in">
      <button
        className="group flex w-full items-center gap-2 py-1 text-left text-sm"
        onClick={() => setOpen((v) => !v)}
      >
        <StatusDot tone={tone} pulse={status === "running"} />
        <span className="shrink-0 text-[var(--color-mute)]">{icon}</span>
        <span className="shrink-0 text-[var(--color-dim)]">{label}</span>
        {detail && (
          <span className="truncate font-mono text-xs text-[var(--color-fg)]">
            {detail}
          </span>
        )}
        {summary && status !== "running" && (
          <span
            className={`shrink-0 text-xs ${
              status === "error"
                ? "text-[var(--color-err)]"
                : "text-[var(--color-mute)]"
            }`}
          >
            · {summary}
          </span>
        )}
        <span className="ml-auto shrink-0 text-[var(--color-faint)] group-hover:text-[var(--color-mute)]">
          {open ? <IconChevronDown size={12} /> : <IconChevronRight size={12} />}
        </span>
      </button>
      {open && (
        <pre className="animate-fade-in mb-1.5 ml-4 overflow-x-auto rounded-[8px] bg-[var(--color-ink)] p-2.5 font-mono text-xs leading-relaxed text-[var(--color-dim)]">
          {args}
        </pre>
      )}
    </div>
  );
}
