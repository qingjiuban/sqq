import { useAgentStore } from "../../store/agentStore";
import type { AgentStatus } from "../../agent/AgentLoop";
import { StatusDot } from "../ui/Status";
import { ToolCallView } from "./ToolCall";

const STATUS: Record<
  AgentStatus,
  { text: string; tone: "idle" | "accent" | "ok" | "err" }
> = {
  idle: { text: "Ready", tone: "idle" },
  thinking: { text: "Thinking", tone: "accent" },
  streaming: { text: "Writing", tone: "accent" },
  "calling-tool": { text: "Working", tone: "accent" },
  "waiting-approval": { text: "Needs approval", tone: "accent" },
  done: { text: "Done", tone: "ok" },
  error: { text: "Error", tone: "err" },
};

/**
 * Agent activity timeline. This is the product's differentiator from a plain
 * chat: it shows what the agent is doing to the workspace, in order.
 */
export default function AgentProgress() {
  const { status, log } = useAgentStore();
  if (status === "idle" && log.length === 0) return null;

  const meta = STATUS[status];
  const active =
    status !== "idle" && status !== "done" && status !== "error";

  return (
    <div className="animate-fade-in rounded-[var(--radius-card)] bg-[var(--color-raised)] px-3 py-2.5">
      <div className="mb-1 flex items-center gap-2">
        <StatusDot
          tone={meta.tone}
          pulse={active}
        />
        <span className="text-xs font-medium text-[var(--color-dim)]">
          {meta.text}
        </span>
      </div>
      <div className="flex flex-col">
        {log.slice(-10).map((entry) => (
          <ToolCallView
            key={entry.call.id}
            call={entry.call}
            status={entry.status}
            summary={entry.summary}
          />
        ))}
      </div>
    </div>
  );
}
