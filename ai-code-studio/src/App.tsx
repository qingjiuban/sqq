import { useEffect, useState } from "react";
import Sidebar from "./components/layout/Sidebar";
import MobileShell, { TAB_ICONS } from "./components/layout/MobileShell";
import CodeEditor from "./components/editor/CodeEditor";
import EditorTabs from "./components/editor/EditorTabs";
import WelcomeScreen from "./components/welcome/WelcomeScreen";
import ChatPanel from "./components/chat/ChatPanel";
import TerminalPanel from "./components/terminal/TerminalPanel";
import PreviewPanel from "./components/preview/PreviewPanel";
import ModelSettings from "./components/settings/ModelSettings";
import { BrandMark, IconSettings, IconTerminal } from "./components/ui/icons";
import { useProjectStore } from "./store/projectStore";
import { useTerminalStore } from "./store/terminalStore";
import { usePreviewStore } from "./store/previewStore";
import { useMediaQuery } from "./lib/useMediaQuery";

type ViewMode = "editor" | "preview";
type MobileTab = "files" | "code" | "chat" | "preview";

/**
 * Two-option segmented switch. Lives in the command bar; the active option is
 * marked by a raised pill rather than a colored block.
 */
function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex items-center gap-0.5 rounded-[8px] bg-[var(--color-ink)] p-0.5">
      {options.map((option) => {
        const active = value === option.value;
        return (
          <button
            key={option.value}
            className={`rounded-[6px] px-3 py-1 text-xs font-medium transition-colors ${
              active
                ? "bg-[var(--color-float)] text-[var(--color-fg)]"
                : "text-[var(--color-mute)] hover:text-[var(--color-dim)]"
            }`}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function MobileLayout({
  onViewChange,
  onOpenSettings,
}: {
  onViewChange: (view: ViewMode) => void;
  onOpenSettings: () => void;
}) {
  const [tab, setTab] = useState<MobileTab>("chat");
  const tabs = useProjectStore((s) => s.tabs);

  return (
    <MobileShell
      value={tab}
      onChange={(next) => {
        setTab(next);
        if (next === "code" || next === "files") onViewChange("editor");
        if (next === "preview") onViewChange("preview");
      }}
      items={[
        { value: "files", label: "文件", icon: TAB_ICONS.files },
        {
          value: "code",
          label: "代码",
          icon: TAB_ICONS.code,
          badge: tabs.length || undefined,
        },
        { value: "chat", label: "智能体", icon: TAB_ICONS.chat },
        { value: "preview", label: "预览", icon: TAB_ICONS.preview },
      ]}
    >
      {tab === "files" && <Sidebar embedded />}
      {tab === "code" && (
        <div className="flex h-full flex-col">
          <EditorTabs />
          <CodeEditor />
          <TerminalPanel />
        </div>
      )}
      {tab === "chat" && <ChatPanel embedded onOpenSettings={onOpenSettings} />}
      {tab === "preview" && <PreviewPanel />}
    </MobileShell>
  );
}

export default function App() {
  const { root, projectName, openProject, restoreProject, saveActive, isMobile } =
    useProjectStore();
  const toggleTerminal = useTerminalStore((s) => s.toggle);
  const terminalCount = useTerminalStore((s) => s.entries.length);
  const previewDetect = usePreviewStore((s) => s.detect);
  const previewReset = usePreviewStore((s) => s.reset);
  const [showSettings, setShowSettings] = useState(false);
  const [view, setView] = useState<ViewMode>("editor");
  const isNarrow = useMediaQuery("(max-width: 767px)");

  useEffect(() => {
    restoreProject();
  }, [restoreProject]);

  useEffect(() => {
    if (root) {
      void previewDetect();
    } else {
      previewReset();
    }
  }, [root, previewDetect, previewReset]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        saveActive();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [saveActive]);

  const settingsModal = showSettings && (
    <ModelSettings onClose={() => setShowSettings(false)} />
  );

  if (isNarrow) {
    return (
      <div className="flex h-[100dvh] w-screen flex-col overflow-hidden bg-[var(--color-ink)] text-[var(--color-fg)]">
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-[var(--color-line-soft)] bg-[var(--color-panel)] px-3">
          <div className="flex items-center gap-2">
            <BrandMark size={22} />
            <span className="text-md font-semibold tracking-tight">
              AI Code Studio
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              className="btn-icon"
              onClick={() => setShowSettings(true)}
              title="设置"
              aria-label="设置"
            >
              <IconSettings />
            </button>
            {root && !isMobile && (
              <button className="btn btn-primary" onClick={openProject}>
                切换
              </button>
            )}
          </div>
        </header>
        <div className="flex min-h-0 flex-1 flex-col">
          {root ? (
            <MobileLayout
              onViewChange={setView}
              onOpenSettings={() => setShowSettings(true)}
            />
          ) : (
            <WelcomeScreen />
          )}
        </div>
        {settingsModal}
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[var(--color-ink)] text-[var(--color-fg)]">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-[var(--color-line-soft)] bg-[var(--color-panel)] pl-3 pr-2.5">
        {/* Brand + project identity */}
        <div className="flex min-w-0 items-center gap-2.5">
          <BrandMark size={24} />
          <span className="shrink-0 text-md font-semibold tracking-tight">
            AI Code Studio
          </span>
          {root && (
            <>
              <span className="h-4 w-px shrink-0 bg-[var(--color-line)]" />
              <span
                className="max-w-52 truncate text-sm text-[var(--color-dim)]"
                title={projectName}
              >
                {projectName || "未命名"}
              </span>
            </>
          )}
        </div>

        {/* Center: primary view switch */}
        <div className="flex flex-1 justify-center">
          {root && (
            <SegmentedControl
              value={view}
              onChange={setView}
              options={[
                { value: "editor", label: "编辑器" },
                { value: "preview", label: "预览" },
              ]}
            />
          )}
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1">
          <button
            className="btn-icon relative"
            onClick={toggleTerminal}
            title="终端"
            aria-label="终端"
          >
            <IconTerminal />
            {terminalCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-3.5 min-w-3.5 place-items-center rounded-full bg-[var(--color-iris)] px-1 text-[9px] font-medium text-white">
                {terminalCount}
              </span>
            )}
          </button>
          <button
            className="btn-icon"
            onClick={() => setShowSettings(true)}
            title="设置"
            aria-label="设置"
          >
            <IconSettings />
          </button>
          <span className="mx-1 h-4 w-px bg-[var(--color-line)]" />
          <button className="btn btn-primary" onClick={openProject}>
            {root ? "切换项目" : "打开项目"}
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {root ? (
          <>
            <Sidebar />
            <main className="flex min-w-0 flex-1 flex-col">
              {view === "editor" ? (
                <>
                  <EditorTabs />
                  <CodeEditor />
                  <TerminalPanel />
                </>
              ) : (
                <PreviewPanel />
              )}
            </main>
          </>
        ) : (
          <div className="min-w-0 flex-1">
            <WelcomeScreen />
          </div>
        )}
        <ChatPanel onOpenSettings={() => setShowSettings(true)} />
      </div>

      {settingsModal}
    </div>
  );
}
