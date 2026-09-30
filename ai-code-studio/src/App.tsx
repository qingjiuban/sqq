import { useEffect, useState } from "react";
import Sidebar from "./components/layout/Sidebar";
import MobileShell, { TAB_ICONS } from "./components/layout/MobileShell";
import AppHeader, { type ViewMode } from "./components/layout/AppHeader";
import CodeEditor from "./components/editor/CodeEditor";
import EditorTabs from "./components/editor/EditorTabs";
import WelcomeScreen from "./components/welcome/WelcomeScreen";
import ChatPanel from "./components/chat/ChatPanel";
import TerminalPanel from "./components/terminal/TerminalPanel";
import PreviewPanel from "./components/preview/PreviewPanel";
import ModelSettings from "./components/settings/ModelSettings";
import { BrandMark, IconSettings } from "./components/ui/icons";
import { useProjectStore } from "./store/projectStore";
import { useTerminalStore } from "./store/terminalStore";
import { usePreviewStore } from "./store/previewStore";
import { useMediaQuery } from "./lib/useMediaQuery";

type MobileTab = "files" | "code" | "chat" | "preview";

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
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "`") {
        e.preventDefault();
        toggleTerminal();
        return;
      }
      if (e.key === "Escape") {
        setShowSettings(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [saveActive, toggleTerminal]);

  const settingsModal = showSettings && (
    <ModelSettings onClose={() => setShowSettings(false)} />
  );

  if (isNarrow) {
    return (
      <div className="flex h-[100dvh] w-screen flex-col overflow-hidden bg-[var(--color-canvas)] text-[var(--color-text)]">
        <header className="flex h-11 shrink-0 items-center justify-between gap-2 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface)] px-3">
          <div className="flex min-w-0 items-center gap-2">
            <BrandMark size={20} />
            <span className="shrink-0 text-sm font-semibold tracking-tight">
              AI Code Studio
            </span>
            {root && projectName && (
              <>
                <span className="h-3.5 w-px shrink-0 bg-[var(--color-border)]" />
                <span className="truncate text-xs text-[var(--color-text-muted)]">
                  {projectName}
                </span>
              </>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              className="btn-icon"
              onClick={() => setShowSettings(true)}
              title="设置"
              aria-label="设置"
            >
              <IconSettings />
            </button>
            {root && !isMobile && (
              <button className="btn btn-primary !h-7" onClick={openProject}>
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
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[var(--color-canvas)] text-[var(--color-text)]">
      <AppHeader
        root={!!root}
        projectName={projectName}
        view={view}
        onViewChange={setView}
        onToggleTerminal={toggleTerminal}
        terminalCount={terminalCount}
        onOpenSettings={() => setShowSettings(true)}
        onOpenProject={openProject}
      />

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
