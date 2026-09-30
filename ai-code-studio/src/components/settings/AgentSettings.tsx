import { useSettingsStore } from "../../store/settingsStore";
import {
  PERMISSION_LABELS,
  type ApprovalMode,
  type PermissionLevel,
} from "../../security/PermissionManager";
import { IconCheck } from "../ui/icons";

const MODES: { value: ApprovalMode; label: string; hint: string }[] = [
  {
    value: "ask-all",
    label: "Ask every time",
    hint: "Confirm before any write or command",
  },
  {
    value: "auto-safe",
    label: "Auto safe",
    hint: "Run reads automatically, ask for the rest",
  },
  {
    value: "full-auto",
    label: "Full auto",
    hint: "Never prompt — the agent acts freely",
  },
];

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 px-5 py-4">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-[var(--color-fg)]">{title}</span>
        {description && (
          <span className="text-xs text-[var(--color-mute)]">{description}</span>
        )}
      </div>
      {children}
    </div>
  );
}

export default function AgentSettings() {
  const {
    level,
    mode,
    autoVerify,
    maxRepairRounds,
    setLevel,
    setMode,
    setAutoVerify,
    setMaxRepairRounds,
  } = useSettingsStore();

  return (
    <div className="divide-soft flex flex-col">
      <Section
        title="Permission level"
        description="Caps which classes of tool the agent may use."
      >
        <div className="flex flex-col gap-1">
          {([0, 1, 2, 3] as PermissionLevel[]).map((value) => {
            const active = level === value;
            return (
              <button
                key={value}
                className={`flex items-center gap-3 rounded-[var(--radius-card)] px-3 py-2.5 text-left text-sm transition-colors ${
                  active
                    ? "bg-[var(--color-raised)] text-[var(--color-fg)]"
                    : "text-[var(--color-dim)] hover:bg-white/[0.03]"
                }`}
                onClick={() => setLevel(value)}
              >
                <span
                  className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border transition-colors ${
                    active
                      ? "border-[var(--color-iris)] bg-[var(--color-iris)]"
                      : "border-[var(--color-line-strong)]"
                  }`}
                >
                  {active && (
                    <IconCheck size={10} className="text-white" strokeWidth={2.4} />
                  )}
                </span>
                <span className="min-w-0">{PERMISSION_LABELS[value]}</span>
              </button>
            );
          })}
        </div>
      </Section>

      <Section
        title="Approval mode"
        description="When the agent pauses to ask for your consent."
      >
        <div className="flex flex-col gap-1">
          {MODES.map((item) => {
            const active = mode === item.value;
            return (
              <button
                key={item.value}
                className={`flex flex-col gap-0.5 rounded-[var(--radius-card)] px-3 py-2.5 text-left transition-colors ${
                  active
                    ? "bg-[var(--color-raised)]"
                    : "hover:bg-white/[0.03]"
                }`}
                onClick={() => setMode(item.value)}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      active
                        ? "bg-[var(--color-iris-hi)]"
                        : "bg-[var(--color-faint)]"
                    }`}
                  />
                  <span
                    className={`text-sm ${
                      active
                        ? "text-[var(--color-fg)]"
                        : "text-[var(--color-dim)]"
                    }`}
                  >
                    {item.label}
                  </span>
                </span>
                <span className="pl-3.5 text-xs text-[var(--color-mute)]">
                  {item.hint}
                </span>
              </button>
            );
          })}
        </div>
      </Section>

      <Section
        title="Self-repair"
        description="Verify edits and feed failures back to the model."
      >
        <label className="flex items-center justify-between gap-4 rounded-[var(--radius-card)] bg-[var(--color-raised)] px-3 py-2.5">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm text-[var(--color-fg)]">
              Auto-verify after edits
            </span>
            <span className="text-xs text-[var(--color-mute)]">
              Runs typecheck / build / test when available
            </span>
          </div>
          <button
            role="switch"
            aria-checked={autoVerify}
            className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
              autoVerify ? "bg-[var(--color-iris)]" : "bg-[var(--color-line-strong)]"
            }`}
            onClick={() => setAutoVerify(!autoVerify)}
          >
            <span
              className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                autoVerify ? "translate-x-[18px]" : "translate-x-0.5"
              }`}
            />
          </button>
        </label>

        <label className="flex items-center justify-between gap-4 rounded-[var(--radius-card)] bg-[var(--color-raised)] px-3 py-2.5">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm text-[var(--color-fg)]">Repair rounds</span>
            <span className="text-xs text-[var(--color-mute)]">
              How many fix attempts before giving up
            </span>
          </div>
          <input
            type="number"
            min={0}
            max={5}
            className="input !h-8 w-16 text-center text-sm"
            value={maxRepairRounds}
            onChange={(e) =>
              setMaxRepairRounds(Math.max(0, Math.min(5, Number(e.target.value))))
            }
          />
        </label>
      </Section>
    </div>
  );
}
