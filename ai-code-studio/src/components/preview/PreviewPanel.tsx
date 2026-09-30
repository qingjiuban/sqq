import { useEffect, useState } from "react";
import { usePreviewStore } from "../../store/previewStore";
import { isMobileOS } from "../../lib/platform";
import {
  IconExternal,
  IconInfo,
  IconPlay,
  IconRefresh,
  IconStop,
} from "../ui/icons";
import { StatusDot } from "../ui/Status";

const DOT_TONE: Record<
  string,
  { tone: "idle" | "accent" | "ok" | "warn" | "err"; pulse?: boolean }
> = {
  idle: { tone: "idle" },
  detecting: { tone: "accent", pulse: true },
  starting: { tone: "warn", pulse: true },
  running: { tone: "ok" },
  stopped: { tone: "idle" },
  error: { tone: "err" },
};

export default function PreviewPanel() {
  const { status, plan, url, error, output, detect, start, stop, refreshStatus } =
    usePreviewStore();
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void refreshStatus();
    }, 3000);
    return () => window.clearInterval(timer);
  }, [refreshStatus]);

  const busy = status === "detecting" || status === "starting";
  const mobile = isMobileOS();
  const dot = DOT_TONE[status] ?? { tone: "idle" as const };

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col bg-[var(--color-ink)]">
      {/* Browser-style toolbar */}
      <div className="flex h-11 shrink-0 items-center gap-2 border-b border-[var(--color-line-soft)] bg-[var(--color-panel)] px-3">
        <StatusDot tone={dot.tone} pulse={dot.pulse} />
        <span className="text-sm font-medium">预览</span>
        <span className="truncate text-xs text-[var(--color-mute)]">
          {plan ? plan.label : "未检测"}
          {status === "starting" && " · 启动中…"}
          {status === "detecting" && " · 检测中…"}
          {plan?.localEntry && " · 设备本地"}
        </span>
        <div className="ml-auto flex items-center gap-1">
          {status === "running" && url && (
            <>
              <button
                className="btn-icon"
                onClick={() => setNonce((n) => n + 1)}
                title="重新加载"
                aria-label="重新加载"
              >
                <IconRefresh size={15} />
              </button>
              <button
                className="btn-icon"
                onClick={() => window.open(url, "_blank")}
                title="在浏览器中打开"
                aria-label="在浏览器中打开"
              >
                <IconExternal size={15} />
              </button>
            </>
          )}
          {status === "running" ? (
            <button className="btn btn-outline" onClick={() => void stop()}>
              <IconStop size={13} />
              停止
            </button>
          ) : (
            <button
              className="btn btn-primary"
              disabled={busy}
              onClick={() => void start()}
            >
              <IconPlay size={13} />
              {busy ? "启动中…" : plan ? "启动" : "检测并启动"}
            </button>
          )}
          <button
            className="btn-icon"
            onClick={() => void detect()}
            disabled={busy}
            title="重新检测项目类型"
            aria-label="重新检测项目类型"
          >
            <IconRefresh size={15} />
          </button>
        </div>
      </div>

      {status === "running" && url ? (
        <iframe
          key={nonce}
          src={url}
          title="预览"
          className="min-h-0 flex-1 border-0 bg-white"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
        />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
          {error ? (
            <div className="flex max-w-md flex-col items-center gap-2">
              <StatusDot tone="err" />
              <p className="text-sm text-[var(--color-err)]">{error}</p>
            </div>
          ) : (
            <>
              <span className="grid h-12 w-12 place-items-center rounded-[14px] bg-[var(--color-panel)] text-[var(--color-faint)]">
                <IconPlay size={22} />
              </span>
              <div className="flex max-w-sm flex-col items-center gap-1.5">
                <span className="text-md font-medium text-[var(--color-dim)]">
                  预览未运行
                </span>
                <span className="text-sm text-[var(--color-mute)]">
                  {mobile
                    ? "在移动端，HTML 和 SVG 文件会直接渲染。可以让智能体创建一个 index.html。"
                    : plan
                      ? "启动本地预览服务，即可在此查看你的应用。"
                      : "先打开一个项目，再启动预览服务。"}
                </span>
                {plan && (
                  <span className="mt-1 inline-flex items-center gap-1.5 text-xs text-[var(--color-faint)]">
                    <IconInfo size={12} />
                    {plan.label} · 端口 {plan.port}
                  </span>
                )}
              </div>
              {!mobile && (
                <button
                  className="btn btn-primary"
                  disabled={busy}
                  onClick={() => void start()}
                >
                  <IconPlay size={13} />
                  {busy ? "启动中…" : "启动预览"}
                </button>
              )}
            </>
          )}
          {output.trim() && (
            <pre className="max-h-40 w-full max-w-2xl overflow-auto rounded-[var(--radius-card)] bg-[var(--color-panel)] p-3 text-left font-mono text-xs leading-relaxed text-[var(--color-dim)]">
              {output.trimEnd()}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
