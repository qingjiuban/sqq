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
  const primaryLabel = isMobile || !desktop ? "打开工作区" : "打开项目文件夹";
  const hint = isMobile
    ? "使用应用私有工作区"
    : "文件始终保留在你的设备上";

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
          用 AI 构建软件。自带模型，编辑文件，运行命令并实时预览你的应用。
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
              title: "模型无关",
              body: "OpenAI、Anthropic、Ollama 或自定义 HTTP。",
            },
            {
              icon: <IconCube size={15} />,
              title: "真实工作区",
              body: "智能体直接读取并编辑你的真实文件。",
            },
            {
              icon: <IconPlay size={15} />,
              title: "运行与预览",
              body: "执行命令并实时预览运行结果。",
            },
            {
              icon: <IconSpark size={15} />,
              title: "自我修复",
              body: "自动校验自己的改动并修复失败。",
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
