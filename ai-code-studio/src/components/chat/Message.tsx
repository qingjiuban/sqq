import type { Message as MessageType } from "../../types/model";
import Markdown from "./Markdown";

export default function Message({ message }: { message: MessageType }) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  if (isSystem) {
    return (
      <div className="rounded-lg border border-[var(--color-warn)]/25 bg-[var(--color-warn)]/[0.07] px-3 py-2 text-[12.5px] whitespace-pre-wrap text-[#f3d9a4]">
        {message.content}
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}>
      <span className="px-1 text-[10px] font-semibold tracking-wide text-[var(--color-mute)] uppercase">
        {isUser ? "You" : "Agent"}
      </span>
      <div
        className={`max-w-[92%] rounded-xl px-3 py-2 ${
          isUser
            ? "rounded-br-sm bg-gradient-to-b from-[#7c6cff] to-[#6250e6] text-[13px] text-white shadow-[0_6px_18px_-10px_rgba(109,94,252,0.9)] whitespace-pre-wrap"
            : "rounded-bl-sm border border-[var(--color-line)] bg-[var(--color-raised)] text-[var(--color-fg)]"
        }`}
      >
        {message.content ? (
          isUser ? (
            message.content
          ) : (
            <Markdown content={message.content} />
          )
        ) : (
          <span className="text-[var(--color-mute)]">…</span>
        )}
      </div>
    </div>
  );
}
