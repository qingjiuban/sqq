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
    label: "每次询问",
    hint: "任何写入或命令前都先确认",
  },
  {
    value: "auto-safe",
    label: "安全自动",
    hint: "读取自动执行，其余操作询问",
  },
  {
    value: "full-auto",
    label: "完全自动",
    hint: "不再提示，智能体自由执行",
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
        <span className="text-sm font-medium text-[var(--color-text)]">{title}</span>
        {description && (
          <span className="text-xs text-[var(--color-text-muted)]">{description}</span>
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
        title="权限级别"
        description="限制智能体可使用的工具类别。"
      >
        <div className="flex flex-col gap-1">
          {([0, 1, 2, 3] as PermissionLevel[]).map((value) => {
            const active = level === value;
            return (
              <button
                key={value}
                className={`flex items-center gap-3 rounded-[var(--radius-panel)] px-3 py-2.5 text-left text-sm transition-colors ${
                  active
                    ? "bg-[var(--color-surface-raised)] text-[var(--color-text)]"
                    : "text-[var(--color-text-secondary)] hover:bg-white/[0.03]"
                }`}
                onClick={() => setLevel(value)}
              >
                <span
                  className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border transition-colors ${
                    active
                      ? "border-[var(--color-accent)] bg-[var(--color-accent)]"
                      : "border-[var(--color-border-strong)]"
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
        title="审批模式"
        description="智能体在何时暂停并征求你的同意。"
      >
        <div className="flex flex-col gap-1">
          {MODES.map((item) => {
            const active = mode === item.value;
            return (
              <button
                key={item.value}
                className={`flex flex-col gap-0.5 rounded-[var(--radius-panel)] px-3 py-2.5 text-left transition-colors ${
                  active
                    ? "bg-[var(--color-surface-raised)]"
                    : "hover:bg-white/[0.03]"
                }`}
                onClick={() => setMode(item.value)}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      active
                        ? "bg-[var(--color-accent-hover)]"
                        : "bg-[var(--color-text-disabled)]"
                    }`}
                  />
                  <span
                    className={`text-sm ${
                      active
                        ? "text-[var(--color-text)]"
                        : "text-[var(--color-text-secondary)]"
                    }`}
                  >
                    {item.label}
                  </span>
                </span>
                <span className="pl-3.5 text-xs text-[var(--color-text-muted)]">
                  {item.hint}
                </span>
              </button>
            );
          })}
        </div>
      </Section>

      <Section
        title="自我修复"
        description="校验改动并将失败反馈给模型。"
      >
        <label className="flex items-center justify-between gap-4 rounded-[var(--radius-panel)] bg-[var(--color-surface-raised)] px-3 py-2.5">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm text-[var(--color-text)]">
              编辑后自动校验
            </span>
            <span className="text-xs text-[var(--color-text-muted)]">
              可用时运行 typecheck / build / test
            </span>
          </div>
          <button
            role="switch"
            aria-checked={autoVerify}
            className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
              autoVerify ? "bg-[var(--color-accent)]" : "bg-[var(--color-border-strong)]"
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

        <label className="flex items-center justify-between gap-4 rounded-[var(--radius-panel)] bg-[var(--color-surface-raised)] px-3 py-2.5">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm text-[var(--color-text)]">修复轮数</span>
            <span className="text-xs text-[var(--color-text-muted)]">
              放弃前最多尝试修复的次数
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
