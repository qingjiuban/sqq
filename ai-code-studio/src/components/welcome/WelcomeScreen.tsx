import { useProjectStore } from "../../store/projectStore";
import { isDesktopApp } from "../../lib/platform";
import { BrandMark, IconCube, IconPlay, IconSpark } from "../ui/icons";

/**
 * Landing surface shown before a workspace exists. One clear action, quiet
 * supporting detail. No fake recents, no decorative glow.
 */
export default function WelcomeScreen() {
  const openProject = useProjectStore((s) => s.openProject);
  const isMobile = useProjectStore((s) => s.isMobile);

  const desktop = isDesktopApp();
  const primaryLabel = isMobile || !desktop ? "Open workspace" : "Open project folder";
  const hint = isMobile
    ? "Uses the app's private workspace"
    : "Files never leave your machine";

  return (
    <div className="relative flex h-full flex-col items-center justify-center overflow-hidden bg-[var(--color-ink)] px-6">
      {/* Subtle atmospheric field — barely visible by design */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 22%, color-mix(in srgb, var(--color-iris) 9%, transparent), transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(var(--color-fg) 1px, transparent 1px), linear-gradient(90deg, var(--color-fg) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
          maskImage:
            "radial-gradient(60% 50% at 50% 30%, black, transparent 75%)",
        }}
      />

      <div className="relative flex w-full max-w-md flex-col items-center">
        <BrandMark size={56} />
        <h1 className="mt-5 text-3xl font-semibold tracking-tight">
          AI Code Studio
        </h1>
        <p className="mt-2 text-center text-sm text-[var(--color-dim)]">
          Build software with AI. Bring your own model, edit files, run
          commands and preview your app.
        </p>

        <button
          className="btn btn-primary mt-7 !h-10 !px-6 !text-base"
          onClick={openProject}
        >
          {primaryLabel}
        </button>
        <span className="mt-2 text-xs text-[var(--color-faint)]">{hint}</span>

        <div className="mt-10 grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
          {[
            {
              icon: <IconSpark size={15} />,
              title: "Model agnostic",
              body: "OpenAI, Anthropic, Ollama or custom HTTP.",
            },
            {
              icon: <IconCube size={15} />,
              title: "Real workspace",
              body: "The agent reads and edits your actual files.",
            },
            {
              icon: <IconPlay size={15} />,
              title: "Run & preview",
              body: "Execute commands and preview the result live.",
            },
            {
              icon: <IconSpark size={15} />,
              title: "Self-repair",
              body: "Verifies its own edits and fixes failures.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="flex items-start gap-2.5 rounded-[var(--radius-card)] bg-[var(--color-panel)] p-3"
            >
              <span className="mt-0.5 shrink-0 text-[var(--color-mute)]">
                {item.icon}
              </span>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-[var(--color-dim)]">
                  {item.title}
                </span>
                <span className="text-xs text-[var(--color-mute)]">
                  {item.body}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
