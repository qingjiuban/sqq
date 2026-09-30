import { useSettingsStore } from "../../store/settingsStore";
import {
  PERMISSION_LABELS,
  type ApprovalMode,
  type PermissionLevel,
} from "../../security/PermissionManager";

const MODES: { value: ApprovalMode; label: string }[] = [
  { value: "ask-all", label: "Ask for every write / command" },
  { value: "auto-safe", label: "Auto-run reads, ask for the rest" },
  { value: "full-auto", label: "Full auto (no prompts)" },
];

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
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-col gap-1.5">
        <span className="label">Permission level</span>
        <div className="flex flex-col gap-1">
          {([0, 1, 2, 3] as PermissionLevel[]).map((value) => (
            <button
              key={value}
              className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-left text-[12px] transition-colors ${
                level === value
                  ? "border-[var(--color-iris)]/50 bg-[var(--color-iris-deep)]/60 text-[var(--color-fg)]"
                  : "border-[var(--color-line)] text-[var(--color-dim)] hover:bg-white/[0.03]"
              }`}
              onClick={() => setLevel(value)}
            >
              <span
                className={`mt-[3px] h-3 w-3 shrink-0 rounded-full border ${
                  level === value
                    ? "border-[var(--color-iris-hi)] bg-[var(--color-iris-hi)]"
                    : "border-[var(--color-line)]"
                }`}
              />
              {PERMISSION_LABELS[value]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="label">Approval mode</span>
        <select
          className="input text-[12.5px]"
          value={mode}
          onChange={(e) => setMode(e.target.value as ApprovalMode)}
        >
          {MODES.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-ink)] p-3">
        <label className="flex items-center justify-between gap-3 text-[12.5px] text-[var(--color-dim)]">
          <span>Auto-verify after edits</span>
          <input
            type="checkbox"
            className="accent-[var(--color-iris)]"
            checked={autoVerify}
            onChange={(e) => setAutoVerify(e.target.checked)}
          />
        </label>
        <label className="flex items-center justify-between gap-3 text-[12.5px] text-[var(--color-dim)]">
          <span>Repair rounds</span>
          <input
            type="number"
            min={0}
            max={5}
            className="input w-16 !py-1 text-center text-[12px]"
            value={maxRepairRounds}
            onChange={(e) =>
              setMaxRepairRounds(Math.max(0, Math.min(5, Number(e.target.value))))
            }
          />
        </label>
      </div>
    </div>
  );
}
