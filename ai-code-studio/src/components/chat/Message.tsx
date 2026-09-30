import type { Message as MessageType } from "../../types/model";
import Markdown from "./Markdown";

/**
 * A conversation turn. User turns are compact bubbles; agent turns read as
 * content on the surface with a quiet speaker label, no heavy card.
 */
export default function Message({ message }: { message: MessageType }) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  if (isSystem) {
    return (
      <div className="animate-fade-in flex gap-2 rounded-[var(--radius-card)] bg-[color-mix(in_srgb,var(--color-warn)_8%,transparent)] px-3 py-2 text-sm whitespace-pre-wrap text-[#e8cf9a]">
        {message.content}
      </div>
    );
  }

  if (isUser) {
    return (
      <div className="animate-fade-in flex flex-col items-end gap-1">
        <span className="eyebrow px-1">你</span>
        <div className="max-w-[88%] rounded-[var(--radius-card)] rounded-br-[4px] bg-[var(--color-float)] px-3 py-2 text-sm whitespace-pre-wrap text-[var(--color-fg)]">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in flex flex-col gap-1">
      <span className="eyebrow px-1">智能体</span>
      <div className="text-sm text-[var(--color-fg)]">
        {message.content ? (
          <Markdown content={message.content} />
        ) : (
          <span className="inline-flex gap-1 py-0.5" aria-label="生成中">
            <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-[var(--color-mute)]" />
            <span
              className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-[var(--color-mute)]"
              style={{ animationDelay: "150ms" }}
            />
            <span
              className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-[var(--color-mute)]"
              style={{ animationDelay: "300ms" }}
            />
          </span>
        )}
      </div>
    </div>
  );
}
