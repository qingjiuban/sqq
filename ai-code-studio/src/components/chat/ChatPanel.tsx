import { useEffect, useRef, useState } from "react";
import { runAgent, type AgentStatus } from "../../agent/AgentLoop";
import { useAgentStore } from "../../store/agentStore";
import { useModelStore } from "../../store/modelStore";
import { useProjectStore } from "../../store/projectStore";
import { useSettingsStore } from "../../store/settingsStore";
import { useTerminalStore } from "../../store/terminalStore";
import type { Message as MessageType } from "../../types/model";
import type { ToolCall } from "../../types/tools";
import {
  IconCheck,
  IconChevronDown,
  IconSend,
  IconSettings,
  IconStop,
} from "../ui/icons";
import { StatusDot } from "../ui/Status";
import AgentProgress from "./AgentProgress";
import Message from "./Message";
import { ToolCallView } from "./ToolCall";
import { describeApproval } from "./toolDisplay";

const STATUS_TEXT: Record<
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

/** Model + approval selector, rendered as a popover instead of raw selects. */
function AgentControls({ onOpenSettings }: { onOpenSettings: () => void }) {
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
    <div className="relative min-w-0" ref={ref}>
      <button
        className="flex max-w-[190px] items-center gap-1.5 rounded-[var(--radius-sm)] px-1.5 py-1 text-xs text-[var(--color-text-secondary)] transition-colors hover:bg-white/[0.05] hover:text-[var(--color-text)]"
        onClick={() => setOpen((v) => !v)}
        title="模型与审批设置"
      >
        <StatusDot tone={active ? "ok" : "idle"} />
        <span className="truncate">{active ? active.model : "未选择模型"}</span>
        <IconChevronDown size={12} className="shrink-0 text-[var(--color-text-muted)]" />
      </button>

      {open && (
        <div className="animate-pop-in absolute bottom-[calc(100%+6px)] left-0 z-40 w-72 overflow-hidden rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-overlay)] shadow-[var(--shadow-pop)]">
          <div className="px-3 pb-1 pt-2.5">
            <span className="text-[11px] font-medium text-[var(--color-text-muted)]">
              模型
            </span>
          </div>
          <div className="max-h-56 overflow-y-auto pb-1">
            {providers.length === 0 && (
              <div className="px-3 py-2 text-xs text-[var(--color-text-muted)]">
                尚未配置服务商
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
                  {isActive ? (
                    <IconCheck
                      size={12}
                      className="shrink-0 text-[var(--color-accent)]"
                      strokeWidth={2.4}
                    />
                  ) : (
                    <span className="w-3 shrink-0" />
                  )}
                  <span className="min-w-0 flex-1 truncate text-[var(--color-text)]">
                    {provider.name}
                  </span>
                  <span className="shrink-0 text-xs text-[var(--color-text-muted)]">
                    {provider.model}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="border-t border-[var(--color-border-subtle)]">
            <div className="px-3 pb-1 pt-2.5">
              <span className="text-[11px] font-medium text-[var(--color-text-muted)]">
                审批
              </span>
            </div>
            <div className="flex gap-1 px-2 pb-2">
              {(
                [
                  { value: "ask-all", label: "全部询问" },
                  { value: "auto-safe", label: "安全自动" },
                  { value: "full-auto", label: "完全自动" },
                ] as const
              ).map((mode) => (
                <button
                  key={mode.value}
                  className={`flex-1 rounded-[var(--radius-sm)] px-1.5 py-1 text-xs transition-colors ${
                    settings.mode === mode.value
                      ? "bg-[var(--color-accent-soft)] text-[var(--color-accent-text)]"
                      : "text-[var(--color-text-muted)] hover:bg-white/[0.05] hover:text-[var(--color-text-secondary)]"
                  }`}
                  onClick={() => settings.setMode(mode.value)}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>
          <button
            className="flex w-full items-center gap-2 border-t border-[var(--color-border-subtle)] px-3 py-2 text-left text-sm text-[var(--color-text-secondary)] transition-colors hover:bg-white/[0.05] hover:text-[var(--color-text)]"
            onClick={() => {
              setOpen(false);
              onOpenSettings();
            }}
          >
            <IconSettings size={14} />
            管理服务商
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
  const stopRef = useRef(false);

  const active = providers.find((p) => p.id === activeId) ?? null;
  const statusMeta = STATUS_TEXT[agent.status];
  const working = agent.status !== "idle" && agent.status !== "done";

  useEffect(() => {
    const node = scrollRef.current;
    if (node) node.scrollTop = node.scrollHeight;
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
    stopRef.current = false;
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
        if (stopRef.current) break;
        switch (event.type) {
          case "status":
            agent.setStatus(event.status);
            break;
          case "delta":
            appendAssistant(event.content);
            break;
          case "notice":
            appendAssistant(`\n[智能体] ${event.content}`);
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
            appendAssistant(`\n[错误] ${event.message}`);
            break;
          default:
            break;
        }
      }
    } catch (error) {
      appendAssistant(
        `\n[错误] ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      setBusy(false);
      agent.setStatus("idle");
      textareaRef.current?.focus();
    }
  };

  const stop = () => {
    stopRef.current = true;
    pending?.resolve(false);
    setPending(null);
    setBusy(false);
    agent.setStatus("idle");
  };

  const canSend = !!active && !busy && !!input.trim();

  return (
    <aside
      className={
        embedded
          ? "flex h-full w-full flex-col bg-[var(--color-surface)]"
          : "flex h-full w-[380px] shrink-0 flex-col border-l border-[var(--color-border-subtle)] bg-[var(--color-surface)]"
      }
    >
      {/* Agent header */}
      <div className="flex h-10 shrink-0 items-center gap-2.5 border-b border-[var(--color-border-subtle)] px-3">
        <span className="text-sm font-semibold tracking-tight">智能体</span>
        <span className="flex items-center gap-1.5">
          <StatusDot tone={statusMeta.tone} pulse={working} />
          <span className="text-xs text-[var(--color-text-secondary)]">
            {statusMeta.text}
          </span>
        </span>
        {active && (
          <span className="ml-auto min-w-0 truncate text-xs text-[var(--color-text-muted)]">
            {active.name}
          </span>
        )}
      </div>

      {/* Transcript */}
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 space-y-4 overflow-y-auto p-3.5"
      >
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
            <span className="text-sm font-medium text-[var(--color-text-secondary)]">
              {active ? "想做点什么？" : "尚未配置模型"}
            </span>
            <span className="max-w-64 text-xs text-[var(--color-text-muted)]">
              {active
                ? "描述一个功能或改动，智能体将直接编辑你的项目。"
                : "添加一个服务商即可开始使用智能体。"}
            </span>
            {!active && (
              <button className="btn btn-primary mt-1" onClick={onOpenSettings}>
                配置模型
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
        <div
          className={`rounded-[var(--radius-panel)] border bg-[var(--color-canvas)] transition-colors ${
            busy
              ? "border-[color-mix(in_srgb,var(--color-accent)_45%,transparent)]"
              : "border-[var(--color-border)] focus-within:border-[color-mix(in_srgb,var(--color-accent)_55%,transparent)]"
          }`}
        >
          <textarea
            ref={textareaRef}
            className="max-h-40 min-h-[54px] w-full resize-none bg-transparent px-3 py-2.5 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-disabled)]"
            value={input}
            placeholder={
              active ? "描述你想构建或修改的内容…" : "请先配置模型"
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
          <div className="flex items-center justify-between gap-2 px-2 pb-2">
            <div className="flex min-w-0 items-center gap-1">
              <AgentControls onOpenSettings={onOpenSettings} />
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="hidden text-[11px] text-[var(--color-text-disabled)] sm:inline">
                {busy ? "智能体正在工作…" : "Enter 发送"}
              </span>
              {busy ? (
                <button
                  className="btn btn-outline !h-8 !px-3"
                  onClick={stop}
                  title="停止"
                  aria-label="停止"
                >
                  <IconStop size={13} />
                  停止
                </button>
              ) : (
                <button
                  className="btn btn-primary !h-8 !w-8 !p-0"
                  onClick={send}
                  disabled={!canSend}
                  title="发送"
                  aria-label="发送"
                >
                  <IconSend size={15} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Approval dialog */}
      {pending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="animate-pop-in w-[min(460px,100%)] overflow-hidden rounded-[var(--radius-modal)] border border-[var(--color-border)] bg-[var(--color-overlay)] shadow-[var(--shadow-modal)]">
            <div className="flex items-center gap-2 px-4 pt-4">
              <StatusDot tone="warn" />
              <span className="text-md font-medium">请求授权</span>
            </div>
            <div className="mx-4 mt-3 rounded-[var(--radius-panel)] bg-[var(--color-canvas)] p-3">
              <ToolCallView call={pending.call} status="running" />
            </div>
            <p className="px-4 pb-4 pt-3 text-sm text-[var(--color-text-secondary)]">
              {describeApproval(pending.call)}
            </p>
            <div className="flex justify-end gap-2 border-t border-[var(--color-border-subtle)] px-4 py-3">
              <button
                className="btn btn-ghost"
                onClick={() => resolveApproval(false)}
              >
                拒绝
              </button>
              <button
                className="btn btn-primary"
                onClick={() => resolveApproval(true)}
              >
                允许一次
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
