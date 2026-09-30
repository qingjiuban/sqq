import { useEffect, useRef, useState } from "react";
import { usePreviewStore } from "../../store/previewStore";
import { isMobileOS } from "../../lib/platform";

function StatusDot({ status }: { status: string }) {
  const color =
    status === "running"
      ? "bg-[var(--color-ok)]"
      : status === "starting" || status === "detecting"
        ? "animate-pulse bg-[var(--color-warn)]"
        : status === "error"
          ? "bg-[var(--color-err)]"
          : "bg-[var(--color-line)]";
  return <span className={`h-1.5 w-1.5 rounded-full ${color}`} />;
}

const STATUS_TEXT: Record<string, string> = {
  idle: "text-[var(--color-mute)]",
  detecting: "text-[var(--color-iris-hi)]",
  starting: "text-[var(--color-warn)]",
  running: "text-[var(--color-ok)]",
  stopped: "text-[var(--color-mute)]",
  error: "text-[var(--color-err)]",
};

export default function PreviewPanel() {
  const {
    status,
    plan,
    url,
    error,
    output,
    detect,
    start,
    stop,
    refreshStatus,
  } = usePreviewStore();
  const [nonce, setNonce] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void refreshStatus();
    }, 3000);
    return () => window.clearInterval(timer);
  }, [refreshStatus]);

  const busy = status === "detecting" || status === "starting";
  const mobile = isMobileOS();

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col bg-[var(--color-ink)]">
      <div className="flex h-9 shrink-0 items-center gap-2 border-b border-[var(--color-line-soft)] bg-[var(--color-panel)] px-3">
        <StatusDot status={status} />
        <span className="panel-title">Preview</span>
        <span className={`text-[11px] ${STATUS_TEXT[status]}`}>
          {plan ? plan.label : "Not detected"}
          {status === "starting" && " · starting…"}
          {status === "detecting" && " · detecting…"}
          {plan?.localEntry && " · on-device"}
        </span>
        <div className="ml-auto flex items-center gap-1">
          {status === "running" && url && (
            <>
              <button
                className="btn btn-ghost !px-2 !py-0.5"
                onClick={() => setNonce((n) => n + 1)}
              >
                Reload
              </button>
              <button
                className="btn btn-ghost !px-2 !py-0.5"
                onClick={() => window.open(url, "_blank")}
              >
                Open
              </button>
            </>
          )}
          {status === "running" ? (
            <button className="btn btn-outline" onClick={() => void stop()}>
              Stop
            </button>
          ) : (
            <button
              className="btn btn-primary"
              disabled={busy}
              onClick={() => void start()}
            >
              {plan ? "Start" : "Detect & Start"}
            </button>
          )}
          <button
            className="btn btn-icon"
            onClick={() => void detect()}
            disabled={busy}
            title="Re-detect project type"
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <path
                d="M13 8a5 5 0 1 1-1.6-3.7M13 2.5V5h-2.5"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {status === "running" && url ? (
        <iframe
          key={nonce}
          ref={iframeRef}
          src={url}
          title="preview"
          className="min-h-0 flex-1 border-0 bg-white"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
        />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
          {error ? (
            <div className="max-w-md text-[12px] text-[var(--color-err)]">
              {error}
            </div>
          ) : (
            <div className="max-w-md text-[12px] text-[var(--color-mute)]">
              {plan
                ? `Ready to start ${plan.label} on port ${plan.port}.`
                : mobile
                  ? "Preview on mobile renders HTML/SVG files directly. Ask the agent to create index.html."
                  : "Open a project, then start a preview server."}
            </div>
          )}
          {output.trim() && (
            <pre className="max-h-40 w-full max-w-2xl overflow-auto rounded-lg border border-[var(--color-line)] bg-[#08090d] p-3 text-left font-mono text-[11px] text-[var(--color-dim)]">
              {output.trimEnd()}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
