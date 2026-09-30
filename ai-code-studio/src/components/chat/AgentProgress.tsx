import { useAgentStore } from "../../store/agentStore";
import type { AgentStatus } from "../../agent/AgentLoop";

const STATUS_TEXT: Record<AgentStatus, string> = {
  idle: "Idle",
  thinking: "Analyzing project…",
  streaming: "Generating…",
  "calling-tool": "Running tool…",
  "waiting-approval": "Waiting for approval…",
  done: "Done",
  error: "Error",
};

export default function AgentProgress() {
  const { status, log } = useAgentStore();
  if (status === "idle" && log.length === 0) return null;

  const active =
    status !== "idle" && status !== "done" && status !== "error";

  return (
    <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-raised)]/70 px-3 py-2">
      <div className="mb-1.5 flex items-center gap-2">
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            active
              ? "animate-pulse bg-[var(--color-iris-hi)]"
              : status === "error"
                ? "bg-[var(--color-err)]"
                : "bg-[var(--color-ok)]"
          }`}
        />
        <span className="text-[10px] font-semibold tracking-wider text-[var(--color-mute)] uppercase">
          Agent · {STATUS_TEXT[status]}
        </span>
      </div>
      <div className="space-y-1">
        {log.slice(-8).map((entry) => {
          const marker =
            entry.status === "running" ? "●" : entry.status === "error" ? "✕" : "✓";
          const color =
            entry.status === "running"
              ? "text-[var(--color-iris-hi)]"
              : entry.status === "error"
                ? "text-[var(--color-err)]"
                : "text-[var(--color-ok)]";
          return (
            <div
              key={entry.call.id}
              className="flex items-center gap-2 font-mono text-[11px]"
            >
              <span className={color}>{marker}</span>
              <span className="text-[var(--color-fg)]">{entry.call.name}</span>
              {entry.summary && (
                <span className="truncate text-[var(--color-mute)]">
                  {entry.summary}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
