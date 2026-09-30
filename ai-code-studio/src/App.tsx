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
import { useProjectStore } from "./store/projectStore";
import { useTerminalStore } from "./store/terminalStore";
import { usePreviewStore } from "./store/previewStore";
import { useMediaQuery } from "./lib/useMediaQuery";

type ViewMode = "editor" | "preview";
type MobileTab = "files" | "code" | "chat" | "preview";

function BrandMark() {
  return (
    <span className="relative grid h-6 w-6 place-items-center rounded-[7px] bg-gradient-to-br from-[#8a7dff] to-[#5b4bd6] text-[11px] font-bold text-white shadow-[0_4px_14px_-4px_rgba(109,94,252,0.9)]">
      ◆
    </span>
  );
}

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
    <div className="flex items-center gap-0.5 rounded-lg border border-[var(--color-line)] bg-[var(--color-panel)] p-0.5">
      {options.map((option) => (
        <button
          key={option.value}
          className={`rounded-[6px] px-2.5 py-1 text-[11px] font-medium capitalize transition-colors ${
            value === option.value
              ? "bg-[var(--color-iris-deep)] text-[#c9c2ff]"
              : "text-[var(--color-mute)] hover:text-[var(--color-dim)]"
          }`}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
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
        { value: "files", label: "Files", icon: TAB_ICONS.files },
        {
          value: "code",
          label: "Code",
          icon: TAB_ICONS.code,
          badge: tabs.length || undefined,
        },
        { value: "chat", label: "Agent", icon: TAB_ICONS.chat },
        { value: "preview", label: "Preview", icon: TAB_ICONS.preview },
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
  const { root, openProject, restoreProject, saveActive, isMobile } =
    useProjectStore();
  const { toggle: toggleTerminal } = useTerminalStore();
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
            <BrandMark />
            <span className="text-[13px] font-semibold tracking-tight">
              AI Code Studio
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              className="btn btn-outline"
              onClick={() => setShowSettings(true)}
            >
              Settings
            </button>
            {root && !isMobile && (
              <button className="btn btn-primary" onClick={openProject}>
                Switch
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
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-[var(--color-line-soft)] bg-[var(--color-panel)] px-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <BrandMark />
            <span className="text-[13px] font-semibold tracking-tight">
              AI Code Studio
            </span>
          </div>
          {root && (
            <SegmentedControl
              value={view}
              onChange={setView}
              options={[
                { value: "editor", label: "Editor" },
                { value: "preview", label: "Preview" },
              ]}
            />
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <button className="btn btn-ghost" onClick={toggleTerminal}>
            Terminal
          </button>
          <button className="btn btn-ghost" onClick={() => setShowSettings(true)}>
            Settings
          </button>
          <button className="btn btn-primary" onClick={openProject}>
            {root ? "Switch Project" : "Open Project"}
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
