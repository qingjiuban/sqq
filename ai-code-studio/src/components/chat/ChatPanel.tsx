import { useEffect, useRef, useState } from "react";
import { runAgent } from "../../agent/AgentLoop";
import { useAgentStore } from "../../store/agentStore";
import { useModelStore } from "../../store/modelStore";
import { useProjectStore } from "../../store/projectStore";
import { useSettingsStore } from "../../store/settingsStore";
import { useTerminalStore } from "../../store/terminalStore";
import type { Message as MessageType } from "../../types/model";
import type { ToolCall } from "../../types/tools";
import AgentProgress from "./AgentProgress";
import Message from "./Message";
import { ToolCallView } from "./ToolCall";

export default function ChatPanel({
  onOpenSettings,
  embedded = false,
}: {
  onOpenSettings: () => void;
  embedded?: boolean;
}) {
  const { providers, activeId, setActive } = useModelStore();
  const { projectName, reloadOpenTabs } = useProjectStore();
  const settings = useSettingsStore();
  const agent = useAgentStore();
  const terminal = useTerminalStore();
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<{
    call: ToolCall;
    resolve: (approved: boolean) => void;
  } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const active = providers.find((p) => p.id === activeId) ?? null;

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      const node = scrollRef.current;
      if (node) node.scrollTop = node.scrollHeight;
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, agent.log, agent.status]);

  const requestApproval = (call: ToolCall) =>
    new Promise<boolean>((resolve) => setPending({ call, resolve }));

  const resolveApproval = (approved: boolean) => {
    pending?.resolve(approved);
    setPending(null);
  };

  const send = async () => {
    if (!active || !input.trim() || busy) return;
    const userMessage: MessageType = { role: "user", content: input.trim() };
    const history = [...messages, userMessage];
    setInput("");
    setMessages([...history, { role: "assistant", content: "" }]);
    setBusy(true);
    agent.reset();

    const appendAssistant = (chunk: string) =>
      setMessages((current) => {
        const copy = [...current];
        const last = copy[copy.length - 1];
        copy[copy.length - 1] = {
          role: "assistant",
          content: last?.role === "assistant" ? last.content + chunk : chunk,
        };
        return copy;
      });

    try {
      for await (const event of runAgent(
        {
          provider: active,
          history,
          projectName: projectName || "project",
          level: settings.level,
          autoVerify: settings.autoVerify,
          maxRepairRounds: settings.maxRepairRounds,
        },
        requestApproval,
      )) {
        switch (event.type) {
          case "status":
            agent.setStatus(event.status);
            break;
          case "delta":
            appendAssistant(event.content);
            break;
          case "notice":
            appendAssistant(`\n[Agent] ${event.content}`);
            break;
          case "tool-start":
            agent.startTool(event.call);
            break;
          case "tool-end":
            agent.endTool(event.call, event.result);
            if (event.result.success) reloadOpenTabs();
            break;
          case "terminal":
            terminal.append(event.entry);
            terminal.setVisible(true);
            break;
          case "error":
            appendAssistant(`\n[Error] ${event.message}`);
            break;
          default:
            break;
        }
      }
    } catch (error) {
      appendAssistant(
        `\n[Error] ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      setBusy(false);
      agent.setStatus("idle");
    }
  };

  return (
    <aside
      className={
        embedded
          ? "flex h-full w-full flex-col bg-[var(--color-panel)]"
          : "flex h-full w-[360px] shrink-0 flex-col border-l border-[var(--color-line-soft)] bg-[var(--color-panel)]"
      }
    >
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-[var(--color-line-soft)] px-3">
        <span className="panel-title">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-iris-hi)]" />
          Agent
        </span>
        <div className="flex items-center gap-1.5">
          <select
            className="rounded-md border border-[var(--color-line)] bg-[var(--color-ink)] px-1.5 py-1 text-[11px] text-[var(--color-dim)] outline-none"
            value={settings.mode}
            onChange={(e) =>
              settings.setMode(e.target.value as typeof settings.mode)
            }
            title="Approval mode"
          >
            <option value="ask-all">Ask all</option>
            <option value="auto-safe">Auto safe</option>
            <option value="full-auto">Full auto</option>
          </select>
          {providers.length > 0 ? (
            <select
              className="max-w-28 rounded-md border border-[var(--color-line)] bg-[var(--color-ink)] px-1.5 py-1 text-[11px] text-[var(--color-dim)] outline-none"
              value={activeId ?? ""}
              onChange={(e) => setActive(e.target.value || null)}
            >
              {providers.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.name}
                </option>
              ))}
            </select>
          ) : (
            <button className="btn btn-outline" onClick={onOpenSettings}>
              Configure
            </button>
          )}
        </div>
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
        {messages.length === 0 && (
          <div className="mt-10 text-center text-[12px] text-[var(--color-mute)]">
            {active
              ? "Describe what you want to build or change."
              : "No model configured. Click Configure."}
          </div>
        )}
        {messages.map((message, index) => (
          <Message key={index} message={message} />
        ))}
        {agent.log.length > 0 && <AgentProgress />}
      </div>

      <div className="border-t border-[var(--color-line-soft)] p-2.5">
        <div className="flex items-end gap-2">
          <textarea
            className="input h-20 flex-1 resize-none leading-relaxed"
            value={input}
            placeholder={
              active ? "Tell the AI what to build…" : "Configure a model first"
            }
            disabled={!active || busy}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />
          <button
            className="btn btn-primary !h-9 !w-9 !p-0"
            onClick={send}
            disabled={!active || busy || !input.trim()}
            title="Send"
          >
            {busy ? (
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            ) : (
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                <path
                  d="M2.5 8 13 2.8 10.2 8 13 13.2 2.5 8Z"
                  fill="currentColor"
                  stroke="currentColor"
                  strokeWidth="0.8"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {pending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-[440px] rounded-xl border border-[var(--color-line)] bg-[var(--color-raised)] p-4 shadow-2xl">
            <div className="mb-2 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-warn)]" />
              <span className="text-[13px] font-medium text-[var(--color-fg)]">
                Permission requested
              </span>
            </div>
            <div className="mb-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-ink)] p-2.5">
              <ToolCallView call={pending.call} status="running" />
            </div>
            <p className="mb-4 text-[12px] text-[var(--color-dim)]">
              {pending.call.name === "write_file" ||
              pending.call.name === "edit_file"
                ? "This will modify files in your project."
                : pending.call.name === "run_command"
                  ? "This will execute a command inside your project."
                  : "Allow this operation?"}
            </p>
            <div className="flex justify-end gap-2">
              <button
                className="btn btn-outline"
                onClick={() => resolveApproval(false)}
              >
                Deny
              </button>
              <button
                className="btn btn-primary"
                onClick={() => resolveApproval(true)}
              >
                Allow once
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
