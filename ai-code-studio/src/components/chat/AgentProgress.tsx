import { useAgentStore } from "../../store/agentStore";
import type { AgentStatus } from "../../agent/AgentLoop";
import { StatusDot } from "../ui/Status";
import { ToolCallView } from "./ToolCall";

const STATUS: Record<
  AgentStatus,
  { text: string; tone: "idle" | "accent" | "ok" | "warn" | "err" }
> = {
  idle: { text: "就绪", tone: "idle" },
  thinking: { text: "思考中", tone: "accent" },
  streaming: { text: "撰写中", tone: "accent" },
  "calling-tool": { text: "执行中", tone: "accent" },
  "waiting-approval": { text: "等待授权", tone: "warn" },
  done: { text: "已完成", tone: "ok" },
  error: { text: "出错", tone: "err" },
};

/**
 * Agent activity timeline — the product's differentiator from a plain chat. It
 * shows, in order, what the agent is doing to the workspace, in plain language.
 */
export default function AgentProgress() {
  const { status, log } = useAgentStore();
  if (status === "idle" && log.length === 0) return null;

  const meta = STATUS[status];
  const active = status !== "idle" && status !== "done" && status !== "error";

  return (
    <div className="animate-fade-in flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <StatusDot tone={meta.tone} pulse={active} />
        <span className="text-[11px] font-medium text-[var(--color-text-secondary)]">
          {meta.text}
        </span>
        <span className="ml-auto text-[11px] text-[var(--color-text-disabled)]">
          {log.length} 步
        </span>
      </div>
      <div className="flex flex-col border-l-2 border-[var(--color-border-subtle)] pl-2.5">
        {log.slice(-12).map((entry) => (
          <ToolCallView
            key={entry.call.id}
            call={entry.call}
            status={entry.status}
            summary={entry.summary}
            output={entry.output}
            durationMs={
              entry.endedAt != null ? entry.endedAt - entry.startedAt : undefined
            }
          />
        ))}
      </div>
    </div>
  );
}
