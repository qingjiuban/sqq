import { useProjectStore } from "../../store/projectStore";
import { isDesktopApp } from "../../lib/platform";

export default function WelcomeScreen() {
  const openProject = useProjectStore((s) => s.openProject);
  const isMobile = useProjectStore((s) => s.isMobile);

  return (
    <div className="relative flex h-full flex-col items-center justify-center gap-8 overflow-hidden bg-[var(--color-ink)]">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 h-96 w-96 rounded-full bg-[var(--color-iris)]/20 blur-[120px]"
      />
      <div className="relative flex flex-col items-center gap-3 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-[#8a7dff] to-[#5b4bd6] text-2xl text-white shadow-[0_18px_40px_-16px_rgba(109,94,252,0.95)]">
          ◆
        </span>
        <h1 className="text-[26px] font-semibold tracking-tight text-[var(--color-fg)]">
          AI Code Studio
        </h1>
        <p className="max-w-sm text-[12.5px] text-[var(--color-dim)]">
          A model-agnostic coding agent. Bring your own model, edit files, run
          commands and preview your app.
        </p>
      </div>

      <div className="relative flex flex-col items-center gap-2">
        <button className="btn btn-primary !px-5 !py-2.5" onClick={openProject}>
          {isMobile || !isDesktopApp() ? "Open workspace" : "Open Project Folder"}
        </button>
        <span className="text-[11px] text-[var(--color-mute)]">
          {isMobile
            ? "Uses the app's private workspace"
            : "Files never leave your machine"}
        </span>
      </div>

      <div className="relative flex flex-wrap items-center justify-center gap-1.5">
        {["Read & edit files", "Agent loop", "Run commands", "Live preview"].map(
          (item) => (
            <span
              key={item}
              className="chip border border-[var(--color-line)] bg-[var(--color-panel)] text-[var(--color-dim)]"
            >
              {item}
            </span>
          ),
        )}
      </div>
    </div>
  );
}
