import { useState } from "react";
import { useModelStore } from "../../store/modelStore";
import AgentSettings from "./AgentSettings";
import ProviderForm from "./ProviderForm";
import {
  IconAgent,
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconClose,
  IconPlug,
  IconPlus,
  IconTrash,
} from "../ui/icons";
import { StatusDot } from "../ui/Status";

type Section = "models" | "agent";

const TYPE_LABEL: Record<string, string> = {
  "openai-compatible": "OpenAI 兼容",
  anthropic: "Anthropic",
  ollama: "Ollama",
  "custom-http": "自定义 HTTP",
};

const SECTIONS: { value: Section; label: string; icon: React.ReactNode }[] = [
  { value: "models", label: "模型与服务商", icon: <IconPlug size={15} /> },
  { value: "agent", label: "智能体", icon: <IconAgent size={15} /> },
];

/**
 * Settings workspace: a left rail for sections, then section content. Provider
 * management is a list + detail split, so the model is never hidden behind a
 * form. Only real sections are shown — nothing invented.
 */
export default function ModelSettings({ onClose }: { onClose: () => void }) {
  const { providers, activeId, setActive, removeProvider } = useModelStore();
  const [section, setSection] = useState<Section>("models");
  const [mobilePane, setMobilePane] = useState<"sections" | "providers" | "detail">("sections");
  const [editingId, setEditingId] = useState<string | "new">(
    providers.length ? providers[0].id : "new",
  );

  const editing =
    editingId === "new"
      ? undefined
      : providers.find((p) => p.id === editingId) ?? undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm md:p-6">
      <div className="animate-pop-in flex h-full w-full flex-col overflow-hidden rounded-[var(--radius-modal)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-modal)] md:h-[min(680px,92vh)] md:w-[min(1040px,96vw)]">
        {/* Rail */}
        <div className="hidden w-56 shrink-0 flex-col border-r border-[var(--color-border-subtle)] bg-[var(--color-canvas)] py-3 md:flex">
          <div className="px-4 pb-3">
            <span className="text-md font-semibold tracking-tight">设置</span>
          </div>
          {SECTIONS.map((item) => {
            const active = section === item.value;
            return (
              <button
                key={item.value}
                className={`mx-2 flex items-center gap-2.5 rounded-[var(--radius-btn)] px-2.5 py-2 text-left text-sm transition-colors ${
                  active
                    ? "bg-[var(--color-surface-raised)] text-[var(--color-text)]"
                    : "text-[var(--color-text-secondary)] hover:bg-white/[0.04] hover:text-[var(--color-text)]"
                }`}
                onClick={() => setSection(item.value)}
              >
                <span
                  className={
                    active
                      ? "text-[var(--color-accent-hover)]"
                      : "text-[var(--color-text-muted)]"
                  }
                >
                  {item.icon}
                </span>
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Mobile top bar: back to section list, title, close */}
        {mobilePane !== "sections" && (
          <div className="flex h-12 shrink-0 items-center justify-between border-b border-[var(--color-border-subtle)] px-2 md:hidden">
            <button
              className="btn-icon"
              onClick={() => setMobilePane("sections")}
              title="返回"
              aria-label="返回"
            >
              <IconChevronLeft size={16} />
            </button>
            <span className="text-md font-medium">
              {section === "models" ? "模型与服务商" : "智能体"}
            </span>
            <button
              className="btn-icon"
              onClick={onClose}
              title="关闭"
              aria-label="关闭设置"
            >
              <IconClose size={16} />
            </button>
          </div>
        )}

        {/* Mobile section list */}
        {mobilePane === "sections" && (
          <div className="flex min-h-0 flex-1 flex-col md:hidden">
            <div className="flex h-12 shrink-0 items-center justify-between border-b border-[var(--color-border-subtle)] px-2">
              <span className="text-md font-semibold">设置</span>
              <button
                className="btn-icon"
                onClick={onClose}
                title="关闭"
                aria-label="关闭设置"
              >
                <IconClose size={16} />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-2">
              {SECTIONS.map((item) => (
                <button
                  key={item.value}
                  className="mb-1 flex w-full items-center gap-2.5 rounded-[var(--radius-btn)] px-2.5 py-2.5 text-left text-sm text-[var(--color-text)] transition-colors hover:bg-white/[0.04]"
                  onClick={() => {
                    setSection(item.value);
                    setMobilePane("providers");
                  }}
                >
                  <span className="text-[var(--color-text-muted)]">
                    {item.icon}
                  </span>
                  <span className="flex-1">{item.label}</span>
                  <IconChevronRight size={14} />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div
          className={`min-h-0 flex-1 md:flex ${
            mobilePane === "sections" ? "hidden" : "flex"
          }`}
        >
        {section === "models" ? (
          <div className="flex min-h-0 min-w-0 flex-1">
            {/* Provider list */}
            <div
              className={`flex w-full min-h-0 shrink-0 flex-col border-r border-[var(--color-border-subtle)] md:w-72 ${
                mobilePane === "providers" ? "" : "hidden md:flex"
              }`}
            >
              <div className="flex h-12 shrink-0 items-center justify-between px-3">
                <span className="section-label">你的服务商</span>
                <button
                  className="btn-icon"
                  onClick={() => setEditingId("new")}
                  title="添加服务商"
                  aria-label="添加服务商"
                >
                  <IconPlus size={15} />
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
                {providers.length === 0 && (
                  <div className="px-2 py-3 text-xs text-[var(--color-text-muted)]">
                    还没有服务商。添加一个即可开始。
                  </div>
                )}
                {providers.map((provider) => {
                  const isEditing = provider.id === editingId;
                  const isActive = provider.id === activeId;
                  return (
                    <div
                      key={provider.id}
                      className={`group mb-1 flex cursor-pointer items-center gap-2.5 rounded-[var(--radius-panel)] px-2.5 py-2 transition-colors ${
                        isEditing
                          ? "bg-[var(--color-surface-raised)]"
                          : "hover:bg-white/[0.04]"
                      }`}
                      onClick={() => setEditingId(provider.id)}
                    >
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[var(--radius-sm)] bg-[var(--color-surface-hover)] text-xs font-semibold text-[var(--color-text-secondary)]">
                        {provider.name.slice(0, 1).toUpperCase()}
                      </span>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-sm text-[var(--color-text)]">
                          {provider.name}
                        </span>
                        <span className="flex items-center gap-1.5 truncate text-xs text-[var(--color-text-muted)]">
                          <StatusDot tone={isActive ? "ok" : "idle"} />
                          {provider.model}
                        </span>
                      </div>
                      {isActive ? (
                        <span className="shrink-0 text-[10px] font-medium text-[var(--color-success)]">
                          使用中
                        </span>
                      ) : (
                        <button
                          className="hidden shrink-0 text-[var(--color-text-muted)] group-hover:block hover:text-[var(--color-error)]"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeProvider(provider.id);
                            if (editingId === provider.id) setEditingId("new");
                          }}
                          title="删除服务商"
                          aria-label="删除服务商"
                        >
                          <IconTrash size={14} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              {editing && (
                <div className="border-t border-[var(--color-border-subtle)] p-2">
                  <button
                    className="btn btn-outline w-full"
                    onClick={() => setActive(editing.id)}
                    disabled={editing.id === activeId}
                  >
                    {editing.id === activeId ? "当前使用" : "设为当前"}
                  </button>
                </div>
              )}
            </div>

            {/* Detail */}
            <div
              className={`flex min-h-0 min-w-0 flex-1 flex-col ${
                mobilePane === "detail" ? "" : "hidden md:flex"
              }`}
            >
              <div className="hidden h-12 shrink-0 items-center justify-between border-b border-[var(--color-border-subtle)] px-4 md:flex">
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-md font-medium">
                    {editingId === "new"
                      ? "新建服务商"
                      : editing?.name ?? "服务商"}
                  </span>
                  {editing && (
                    <span className="truncate text-xs text-[var(--color-text-muted)]">
                      {TYPE_LABEL[editing.type] ?? editing.type}
                    </span>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {editing && editing.id === activeId && (
                    <span className="flex items-center gap-1.5 text-xs text-[var(--color-success)]">
                      <IconCheck size={13} strokeWidth={2.4} />
                      已连接
                    </span>
                  )}
                  <button
                    className="btn-icon"
                    onClick={onClose}
                    title="关闭"
                    aria-label="关闭设置"
                  >
                    <IconClose size={15} />
                  </button>
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto">
                <ProviderForm
                  key={editingId}
                  initial={editing}
                  onDone={() => {
                    setEditingId(editing?.id ?? "new");
                    setMobilePane("providers");
                  }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <div className="hidden h-12 shrink-0 items-center justify-between border-b border-[var(--color-border-subtle)] px-4 md:flex">
              <span className="text-md font-medium">智能体行为</span>
              <button
                className="btn-icon"
                onClick={onClose}
                title="关闭"
                aria-label="关闭设置"
              >
                <IconClose size={15} />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <AgentSettings />
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
