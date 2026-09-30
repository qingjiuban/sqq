import type { Message as MessageType } from "../../types/model";
import Markdown from "./Markdown";

/**
 * A conversation turn. User turns are compact labeled blocks; agent turns read
 * as content on the surface with a quiet speaker label — no heavy card.
 */
export default function Message({ message }: { message: MessageType }) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  if (isSystem) {
    return (
      <div className="animate-fade-in flex gap-2 rounded-[var(--radius-sm)] bg-[color-mix(in_srgb,var(--color-warning)_8%,transparent)] px-3 py-2 text-sm whitespace-pre-wrap text-[var(--color-warning)]">
        {message.content}
      </div>
    );
  }

  if (isUser) {
    return (
      <div className="animate-fade-in flex flex-col gap-1">
        <span className="text-[11px] font-medium text-[var(--color-text-muted)]">
          你
        </span>
        <div className="rounded-[var(--radius-sm)] bg-[var(--color-surface-raised)] px-3 py-2 text-sm whitespace-pre-wrap text-[var(--color-text)]">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in flex flex-col gap-1.5">
      <span className="text-[11px] font-medium text-[var(--color-text-muted)]">
        智能体
      </span>
      <div className="border-l-2 border-[var(--color-border-subtle)] pl-3 text-sm text-[var(--color-text)]">
        {message.content ? (
          <Markdown content={message.content} />
        ) : (
          <span className="inline-flex gap-1 py-0.5" aria-label="生成中">
            <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-[var(--color-text-muted)]" />
            <span
              className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-[var(--color-text-muted)]"
              style={{ animationDelay: "150ms" }}
            />
            <span
              className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-[var(--color-text-muted)]"
              style={{ animationDelay: "300ms" }}
            />
          </span>
        )}
      </div>
    </div>
  );
}

