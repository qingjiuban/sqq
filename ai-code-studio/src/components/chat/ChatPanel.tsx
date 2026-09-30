import { useEffect, useRef, useState } from "react";
import { runAgent } from "../../agent/AgentLoop";
import { useAgentStore } from "../../store/agentStore";
import { useModelStore } from "../../store/modelStore";
import { useProjectStore } from "../../store/projectStore";
import { useSettingsStore } from "../../store/settingsStore";
import { useTerminalStore } from "../../store/terminalStore";
import type { Message as MessageType } from "../../types/model";
import type { ToolCall } from "../../types/tools";
import {
  IconChevronDown,
  IconSend,
  IconSettings,
  IconSpark,
} from "../ui/icons";
import { StatusDot } from "../ui/Status";
import AgentProgress from "./AgentProgress";
import Message from "./Message";
import { ToolCallView } from "./ToolCall";
import { describeApproval } from "./toolDisplay";

/** Model + approval mode selector, rendered as a popover instead of raw selects. */
function AgentControls({
  onOpenSettings,
}: {
  onOpenSettings: () => void;
}) {
  const { providers, activeId, setActive } = useModelStore();
  const settings = useSettingsStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  const active = providers.find((p) => p.id === activeId) ?? null;

  return (
    <div className="relative" ref={ref}>
      <button
        className="flex max-w-[190px] items-center gap-1.5 rounded-[var(--radius-btn)] px-2 py-1 text-xs text-[var(--color-dim)] transition-colors hover:bg-white/[0.05] hover:text-[var(--color-fg)]"
        onClick={() => setOpen((v) => !v)}
      >
        <StatusDot tone={active ? "ok" : "idle"} />
        <span className="truncate">{active ? active.name : "No model"}</span>
        <IconChevronDown size={12} className="shrink-0 text-[var(--color-mute)]" />
      </button>

      {open && (
        <div className="animate-pop-in absolute right-0 top-[calc(100%+6px)] z-40 w-64 overflow-hidden rounded-[var(--radius-panel)] border border-[var(--color-line)] bg-[var(--color-float)] shadow-[var(--shadow-pop)]">
          <div className="px-3 pb-1 pt-2.5">
            <span className="eyebrow">Model</span>
          </div>
          <div className="max-h-56 overflow-y-auto pb-1">
            {providers.length === 0 && (
              <div className="px-3 py-2 text-xs text-[var(--color-mute)]">
                No providers configured
              </div>
            )}
            {providers.map((provider) => {
              const isActive = provider.id === activeId;
              return (
                <button
                  key={provider.id}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors hover:bg-white/[0.05]"
                  onClick={() => {
                    setActive(provider.id);
                    setOpen(false);
                  }}
                >
                  <StatusDot tone={isActive ? "ok" : "idle"} />
                  <span className="min-w-0 flex-1 truncate text-[var(--color-fg)]">
                    {provider.name}
                  </span>
                  <span className="shrink-0 text-xs text-[var(--color-mute)]">
                    {provider.model}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="border-t border-[var(--color-line-soft)]">
            <div className="px-3 pb-1 pt-2.5">
              <span className="eyebrow">Approval</span>
            </div>
            <div className="flex gap-1 px-2 pb-2">
              {(
                [
                  { value: "ask-all", label: "Ask all" },
                  { value: "auto-safe", label: "Auto safe" },
                  { value: "full-auto", label: "Full auto" },
                ] as const
              ).map((mode) => (
                <button
                  key={mode.value}
                  className={`flex-1 rounded-[var(--radius-sm)] px-1.5 py-1 text-xs transition-colors ${
                    settings.mode === mode.value
                      ? "bg-[var(--color-iris-deep)] text-[var(--color-iris-ink)]"
                      : "text-[var(--color-mute)] hover:bg-white/[0.05] hover:text-[var(--color-dim)]"
                  }`}
                  onClick={() => settings.setMode(mode.value)}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>
          <button
            className="flex w-full items-center gap-2 border-t border-[var(--color-line-soft)] px-3 py-2 text-left text-sm text-[var(--color-dim)] transition-colors hover:bg-white/[0.05] hover:text-[var(--color-fg)]"
            onClick={() => {
              setOpen(false);
              onOpenSettings();
            }}
          >
            <IconSettings size={14} />
            Manage providers
          </button>
        </div>
      )}
    </div>
  );
}

export default function ChatPanel({
  onOpenSettings,
  embedded = false,
}: {
  onOpenSettings: () => void;
  embedded?: boolean;
}) {
  const { providers, activeId } = useModelStore();
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const canSend = !!active && !busy && !!input.trim();

  return (
    <aside
      className={
        embedded
          ? "flex h-full w-full flex-col bg-[var(--color-panel)]"
          : "flex h-full w-[380px] shrink-0 flex-col border-l border-[var(--color-line-soft)] bg-[var(--color-panel)]"
      }
    >
      {/* Agent header */}
      <div className="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-[var(--color-line-soft)] px-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-[7px] bg-[var(--color-iris-deep)] text-[var(--color-iris-hi)]">
            <IconSpark size={14} />
          </span>
          <span className="truncate text-sm font-medium">AI Agent</span>
        </div>
        <AgentControls onOpenSettings={onOpenSettings} />
      </div>

      {/* Transcript */}
      <div ref={scrollRef} className="min-h-0 flex-1 space-y-3.5 overflow-y-auto p-3.5">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
            <span className="grid h-10 w-10 place-items-center rounded-[12px] bg-[var(--color-raised)] text-[var(--color-mute)]">
              <IconSpark size={18} />
            </span>
            <span className="text-sm font-medium text-[var(--color-dim)]">
              {active ? "What should we build?" : "No model configured"}
            </span>
            <span className="text-xs text-[var(--color-mute)]">
              {active
                ? "Describe a feature or a change and the agent will edit your project."
                : "Add a provider to start using the agent."}
            </span>
            {!active && (
              <button
                className="btn btn-primary mt-1"
                onClick={onOpenSettings}
              >
                Configure model
              </button>
            )}
          </div>
        )}
        {messages.map((message, index) => (
          <Message key={index} message={message} />
        ))}
        {agent.log.length > 0 && <AgentProgress />}
      </div>

      {/* Composer */}
      <div className="shrink-0 p-2.5">
        <div className="rounded-[var(--radius-panel)] border border-[var(--color-line)] bg-[var(--color-ink)] transition-colors focus-within:border-[color-mix(in_srgb,var(--color-iris)_55%,transparent)]">
          <textarea
            ref={textareaRef}
            className="max-h-40 min-h-[62px] w-full resize-none bg-transparent px-3 py-2.5 text-sm text-[var(--color-fg)] outline-none placeholder:text-[var(--color-faint)]"
            value={input}
            placeholder={
              active ? "Describe what to build or change…" : "Configure a model first"
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
          <div className="flex items-center justify-between px-2 pb-2">
            <span className="px-1 text-xs text-[var(--color-faint)]">
              {busy ? "Agent is working…" : "Enter to send · Shift+Enter for newline"}
            </span>
            <button
              className="btn btn-primary !h-8 !w-8 !p-0"
              onClick={send}
              disabled={!canSend}
              title="Send"
              aria-label="Send"
            >
              {busy ? (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-[1.5px] border-white/30 border-t-white" />
              ) : (
                <IconSend size={15} />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Approval dialog */}
      {pending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="animate-pop-in w-[min(460px,100%)] overflow-hidden rounded-[var(--radius-modal)] border border-[var(--color-line)] bg-[var(--color-float)] shadow-[var(--shadow-modal)]">
            <div className="flex items-center gap-2 px-4 pt-4">
              <StatusDot tone="warn" />
              <span className="text-md font-medium">Permission requested</span>
            </div>
            <div className="mx-4 mt-3 rounded-[var(--radius-card)] bg-[var(--color-ink)] p-3">
              <ToolCallView call={pending.call} status="running" />
            </div>
            <p className="px-4 pb-4 pt-3 text-sm text-[var(--color-dim)]">
              {describeApproval(pending.call)}
            </p>
            <div className="flex justify-end gap-2 border-t border-[var(--color-line-soft)] px-4 py-3">
              <button
                className="btn btn-ghost"
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
