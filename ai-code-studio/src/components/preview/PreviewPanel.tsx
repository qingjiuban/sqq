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

/**
 * Browser-like preview workspace. A compact toolbar (status, address, actions)
 * over a single viewport; the empty state explains what preview is and how to
 * start it instead of dumping raw logs.
 */
export default function PreviewPanel() {
  const { status, plan, url, error, output, detect, start, stop, refreshStatus } =
    usePreviewStore();
  const [nonce, setNonce] = useState(0);
  const [showOutput, setShowOutput] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void refreshStatus();
    }, 3000);
    return () => window.clearInterval(timer);
  }, [refreshStatus]);

  const busy = status === "detecting" || status === "starting";
  const mobile = isMobileOS();
  const dot = DOT_TONE[status] ?? { tone: "idle" as const };
  const running = status === "running" && !!url;
  const address = running ? url : plan ? plan.label : "无地址";

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col bg-[var(--color-canvas)]">
      {/* Compact toolbar */}
      <div className="flex h-10 shrink-0 items-center gap-2 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface)] px-2.5">
        <span className="flex shrink-0 items-center gap-1.5 pl-1">
          <StatusDot tone={dot.tone} pulse={dot.pulse} />
          <span className="text-sm font-medium">预览</span>
        </span>

        {/* Address pill */}
        <div className="flex h-6 min-w-0 flex-1 items-center gap-1.5 rounded-[var(--radius-sm)] bg-[var(--color-canvas)] px-2">
          <span className="truncate font-mono text-[11px] text-[var(--color-text-muted)]">
            {address}
          </span>
          {plan?.localEntry && (
            <span className="shrink-0 text-[10px] text-[var(--color-text-disabled)]">
              设备本地
            </span>
          )}
          {status === "starting" && (
            <span className="shrink-0 text-[10px] text-[var(--color-warning)]">
              启动中…
            </span>
          )}
          {status === "detecting" && (
            <span className="shrink-0 text-[10px] text-[var(--color-text-muted)]">
              检测中…
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-0.5">
          {running && (
            <>
              <button
                className="btn-icon !h-7 !w-7"
                onClick={() => setNonce((n) => n + 1)}
                title="重新加载"
                aria-label="重新加载"
              >
                <IconRefresh size={15} />
              </button>
              <button
                className="btn-icon !h-7 !w-7"
                onClick={() => window.open(url, "_blank")}
                title="在浏览器中打开"
                aria-label="在浏览器中打开"
              >
                <IconExternal size={15} />
              </button>
              <button className="btn btn-outline !h-7" onClick={() => void stop()}>
                <IconStop size={13} />
                停止
              </button>
            </>
          )}
          {!running && (
            <button
              className="btn btn-primary !h-7"
              disabled={busy}
              onClick={() => void start()}
            >
              <IconPlay size={13} />
              {busy ? "启动中…" : plan ? "启动" : "检测并启动"}
            </button>
          )}
          <button
            className="btn-icon !h-7 !w-7"
            onClick={() => void detect()}
            disabled={busy}
            title="重新检测项目类型"
            aria-label="重新检测项目类型"
          >
            <IconRefresh size={15} />
          </button>
        </div>
      </div>

      {running ? (
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
              <span className="text-md font-medium text-[var(--color-text-secondary)]">
                预览启动失败
              </span>
              <p className="text-sm text-[var(--color-error)]">{error}</p>
              <button
                className="btn btn-outline mt-1"
                onClick={() => void start()}
              >
                重试
              </button>
            </div>
          ) : (
            <>
              <span className="grid h-12 w-12 place-items-center rounded-[var(--radius-panel)] bg-[var(--color-surface)] text-[var(--color-text-disabled)]">
                <IconPlay size={22} />
              </span>
              <div className="flex max-w-sm flex-col items-center gap-1.5">
                <span className="text-md font-medium text-[var(--color-text-secondary)]">
                  预览未运行
                </span>
                <span className="text-sm text-[var(--color-text-muted)]">
                  {mobile
                    ? "在移动端，HTML 和 SVG 文件会直接渲染。可以让智能体创建一个 index.html。"
                    : plan
                      ? "启动本地预览服务，即可在此查看你的应用。"
                      : "先打开一个项目，再启动预览服务。"}
                </span>
                {plan && (
                  <span className="mt-1 inline-flex items-center gap-1.5 text-xs text-[var(--color-text-disabled)]">
                    <IconInfo size={12} />
                    {plan.label}
                    {plan.port ? ` · 端口 ${plan.port}` : ""}
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
            <div className="mt-2 w-full max-w-2xl text-left">
              <button
                className="text-xs text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-secondary)]"
                onClick={() => setShowOutput((v) => !v)}
              >
                {showOutput ? "隐藏日志" : "查看日志"}
              </button>
              {showOutput && (
                <pre className="animate-fade-in mt-2 max-h-40 overflow-auto rounded-[var(--radius-panel)] bg-[var(--color-surface)] p-3 font-mono text-xs leading-relaxed text-[var(--color-text-secondary)]">
                  {output.trimEnd()}
                </pre>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
