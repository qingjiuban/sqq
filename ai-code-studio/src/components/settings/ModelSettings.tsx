import { useState } from "react";
import { useModelStore } from "../../store/modelStore";
import AgentSettings from "./AgentSettings";
import ProviderForm from "./ProviderForm";
import {
  IconAgent,
  IconClose,
  IconPlug,
  IconPlus,
  IconTrash,
} from "../ui/icons";
import { StatusDot } from "../ui/Status";

type Section = "models" | "agent";

const TYPE_LABEL: Record<string, string> = {
  "openai-compatible": "OpenAI Compatible",
  anthropic: "Anthropic",
  ollama: "Ollama",
  "custom-http": "Custom HTTP",
};

/**
 * Settings workspace: a left rail for sections, then section content. Provider
 * management is a list + detail split, so the model is never hidden behind a
 * form.
 */
export default function ModelSettings({ onClose }: { onClose: () => void }) {
  const { providers, activeId, setActive, removeProvider } = useModelStore();
  const [section, setSection] = useState<Section>("models");
  const [editingId, setEditingId] = useState<string | "new">(
    providers.length ? providers[0].id : "new",
  );

  const editing =
    editingId === "new"
      ? undefined
      : providers.find((p) => p.id === editingId) ?? undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="animate-pop-in flex h-[min(660px,92vh)] w-[min(1000px,96vw)] overflow-hidden rounded-[var(--radius-modal)] border border-[var(--color-line)] bg-[var(--color-panel)] shadow-[var(--shadow-modal)]">
        {/* Rail */}
        <div className="flex w-52 shrink-0 flex-col border-r border-[var(--color-line-soft)] bg-[var(--color-ink)] py-3">
          <div className="px-4 pb-3">
            <span className="text-md font-semibold tracking-tight">Settings</span>
          </div>
          {(
            [
              { value: "models", label: "Models", icon: <IconPlug size={15} /> },
              { value: "agent", label: "Agent", icon: <IconAgent size={15} /> },
            ] as const
          ).map((item) => {
            const active = section === item.value;
            return (
              <button
                key={item.value}
                className={`mx-2 flex items-center gap-2.5 rounded-[var(--radius-btn)] px-2.5 py-2 text-left text-sm transition-colors ${
                  active
                    ? "bg-[var(--color-raised)] text-[var(--color-fg)]"
                    : "text-[var(--color-dim)] hover:bg-white/[0.04] hover:text-[var(--color-fg)]"
                }`}
                onClick={() => setSection(item.value)}
              >
                <span className="text-[var(--color-mute)]">{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {section === "models" ? (
          <div className="flex min-w-0 flex-1">
            {/* Provider list */}
            <div className="flex w-64 shrink-0 flex-col border-r border-[var(--color-line-soft)]">
              <div className="flex h-12 shrink-0 items-center justify-between px-3">
                <span className="section-label">Your providers</span>
                <button
                  className="btn-icon"
                  onClick={() => setEditingId("new")}
                  title="Add provider"
                  aria-label="Add provider"
                >
                  <IconPlus size={15} />
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
                {providers.length === 0 && (
                  <div className="px-2 py-3 text-xs text-[var(--color-mute)]">
                    No providers yet. Add one to get started.
                  </div>
                )}
                {providers.map((provider) => {
                  const isEditing = provider.id === editingId;
                  const isActive = provider.id === activeId;
                  return (
                    <div
                      key={provider.id}
                      className={`group mb-1 flex cursor-pointer items-center gap-2.5 rounded-[var(--radius-card)] px-2.5 py-2 transition-colors ${
                        isEditing
                          ? "bg-[var(--color-raised)]"
                          : "hover:bg-white/[0.04]"
                      }`}
                      onClick={() => setEditingId(provider.id)}
                    >
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[8px] bg-[var(--color-float)] text-xs font-semibold text-[var(--color-dim)]">
                        {provider.name.slice(0, 1).toUpperCase()}
                      </span>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-sm text-[var(--color-fg)]">
                          {provider.name}
                        </span>
                        <span className="truncate text-xs text-[var(--color-mute)]">
                          {provider.model}
                        </span>
                      </div>
                      {isActive ? (
                        <StatusDot tone="ok" />
                      ) : (
                        <button
                          className="hidden shrink-0 text-[var(--color-mute)] group-hover:block hover:text-[var(--color-fg)]"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeProvider(provider.id);
                            if (editingId === provider.id) setEditingId("new");
                          }}
                          title="Delete provider"
                          aria-label="Delete provider"
                        >
                          <IconTrash size={14} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              {editing && (
                <div className="border-t border-[var(--color-line-soft)] p-2">
                  <button
                    className="btn btn-outline w-full"
                    onClick={() => setActive(editing.id)}
                    disabled={editing.id === activeId}
                  >
                    {editing.id === activeId ? "Active" : "Set as active"}
                  </button>
                </div>
              )}
            </div>

            {/* Detail */}
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex h-12 shrink-0 items-center justify-between border-b border-[var(--color-line-soft)] px-4">
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-md font-medium">
                    {editingId === "new"
                      ? "New provider"
                      : editing?.name ?? "Provider"}
                  </span>
                  {editing && (
                    <span className="truncate text-xs text-[var(--color-mute)]">
                      {TYPE_LABEL[editing.type] ?? editing.type}
                    </span>
                  )}
                </div>
                <button
                  className="btn-icon"
                  onClick={onClose}
                  title="Close"
                  aria-label="Close settings"
                >
                  <IconClose size={15} />
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto">
                <ProviderForm
                  key={editingId}
                  initial={editing}
                  onDone={() => setEditingId(editing?.id ?? "new")}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex h-12 shrink-0 items-center justify-between border-b border-[var(--color-line-soft)] px-4">
              <span className="text-md font-medium">Agent behaviour</span>
              <button
                className="btn-icon"
                onClick={onClose}
                title="Close"
                aria-label="Close settings"
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
  );
}
