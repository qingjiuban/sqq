import type { ToolCall } from "../../types/tools";

export function ToolCallView({
  call,
  status,
  summary,
}: {
  call: ToolCall;
  status?: "running" | "ok" | "error";
  summary?: string;
}) {
  const marker = status === "running" ? "●" : status === "error" ? "✕" : "✓";
  const color =
    status === "running"
      ? "text-[var(--color-iris-hi)]"
      : status === "error"
        ? "text-[var(--color-err)]"
        : "text-[var(--color-ok)]";
  const args = JSON.stringify(call.arguments);
  return (
    <div className="flex items-start gap-2 font-mono text-[11px] text-[var(--color-dim)]">
      <span className={color}>{marker}</span>
      <span className="text-[var(--color-fg)]">{call.name}</span>
      <span className="truncate text-[var(--color-mute)]">
        {args.length > 120 ? `${args.slice(0, 120)}…` : args}
      </span>
      {summary && status !== "running" && (
        <span className={color}>— {summary}</span>
      )}
    </div>
  );
}
