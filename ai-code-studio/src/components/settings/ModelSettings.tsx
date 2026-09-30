import { useState } from "react";
import { useModelStore } from "../../store/modelStore";
import AgentSettings from "./AgentSettings";
import ProviderForm from "./ProviderForm";

export default function ModelSettings({ onClose }: { onClose: () => void }) {
  const { providers, activeId, setActive, removeProvider } = useModelStore();
  const [tab, setTab] = useState<"providers" | "agent">("providers");
  const [editingId, setEditingId] = useState<string | "new" | null>(
    providers.length ? providers[0].id : "new",
  );

  const editing =
    editingId === "new"
      ? undefined
      : providers.find((p) => p.id === editingId) ?? undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="flex h-[min(640px,92vh)] w-[min(920px,96vw)] overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel)] shadow-[0_40px_120px_-40px_rgba(0,0,0,0.95)]">
        <div className="flex w-60 shrink-0 flex-col border-r border-[var(--color-line-soft)] bg-[var(--color-ink)]">
          <div className="flex h-12 items-center px-3">
            <span className="panel-title">Settings</span>
          </div>
          <div className="mx-2 mb-2 flex items-center gap-0.5 rounded-lg border border-[var(--color-line)] bg-[var(--color-panel)] p-0.5">
            {(["providers", "agent"] as const).map((value) => (
              <button
                key={value}
                className={`flex-1 rounded-[6px] px-2 py-1 text-[11px] font-medium capitalize transition-colors ${
                  tab === value
                    ? "bg-[var(--color-iris-deep)] text-[#c9c2ff]"
                    : "text-[var(--color-mute)] hover:text-[var(--color-dim)]"
                }`}
                onClick={() => setTab(value)}
              >
                {value}
              </button>
            ))}
          </div>

          {tab === "providers" ? (
            <>
              <div className="flex-1 overflow-y-auto px-2">
                {providers.length === 0 && (
                  <div className="px-2 py-3 text-[11px] text-[var(--color-mute)]">
                    No providers yet.
                  </div>
                )}
                {providers.map((provider) => (
                  <button
                    key={provider.id}
                    className={`mb-0.5 flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-[12.5px] transition-colors ${
                      provider.id === editingId
                        ? "bg-[var(--color-iris-deep)] text-[#d6d0ff]"
                        : "text-[var(--color-dim)] hover:bg-white/[0.04]"
                    }`}
                    onClick={() => setEditingId(provider.id)}
                  >
                    <span className="truncate">{provider.name}</span>
                    {provider.id === activeId && (
                      <span className="chip bg-[var(--color-ok)]/15 text-[var(--color-ok)]">
                        active
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <div className="flex flex-col gap-1.5 border-t border-[var(--color-line-soft)] p-2">
                <button
                  className="btn btn-outline w-full"
                  onClick={() => setEditingId("new")}
                >
                  + Add Provider
                </button>
                {editing && (
                  <div className="flex gap-1.5">
                    <button
                      className="btn btn-outline flex-1"
                      onClick={() => setActive(editing.id)}
                    >
                      Set Active
                    </button>
                    <button
                      className="btn border border-[var(--color-err)]/40 text-[var(--color-err)] hover:bg-[var(--color-err)]/10"
                      onClick={() => {
                        removeProvider(editing.id);
                        setEditingId("new");
                      }}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 overflow-y-auto">
              <AgentSettings />
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex h-12 shrink-0 items-center justify-between border-b border-[var(--color-line-soft)] px-4">
            <span className="text-[13px] font-medium text-[var(--color-fg)]">
              {tab === "agent"
                ? "Agent behaviour"
                : editingId === "new"
                  ? "New Provider"
                  : editing?.name}
            </span>
            <button className="btn btn-icon" onClick={onClose} title="Close">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path
                  d="M4 4l8 8M12 4l-8 8"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
          <div className="min-h-0 flex-1">
            {tab === "agent" ? (
              <div className="p-4 text-[12px] leading-relaxed text-[var(--color-dim)]">
                These settings control how the agent is allowed to act and whether
                it verifies its own changes. Permission level caps which tool
                classes can run; the approval mode decides when you are asked.
                Auto-verify runs the project's typecheck/build/test after the
                agent edits files and feeds failures back for repair.
              </div>
            ) : (
              <ProviderForm
                key={editingId ?? "new"}
                initial={editing}
                onDone={() => setEditingId(editing?.id ?? "new")}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
