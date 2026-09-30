import Editor from "@monaco-editor/react";
import { useShallow } from "zustand/react/shallow";
import { useProjectStore } from "../../store/projectStore";
import { languageFromPath } from "../../lib/api";

export default function CodeEditor() {
  const { tabs, activePath, updateActiveContent } = useProjectStore(
    useShallow((s) => ({
      tabs: s.tabs,
      activePath: s.activePath,
      updateActiveContent: s.updateActiveContent,
    })),
  );
  const activeTab = tabs.find((t) => t.path === activePath) ?? null;

  if (!activeTab) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 bg-[var(--color-ink)]">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" className="text-[var(--color-line)]">
          <path
            d="M8 4h8l4 4v12H8V4Z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <path d="M16 4v4h4" stroke="currentColor" strokeWidth="1.4" />
        </svg>
        <span className="text-[12px] text-[var(--color-mute)]">
          Select a file to start editing
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1">
      <Editor
        height="100%"
        theme="acs-dark"
        language={languageFromPath(activeTab.path)}
        path={activeTab.path}
        value={activeTab.content}
        onChange={(value) => updateActiveContent(value ?? "")}
        options={{
          fontSize: 13,
          fontFamily:
            "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
          minimap: { enabled: true, scale: 1 },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          renderWhitespace: "selection",
          smoothScrolling: true,
          cursorBlinking: "smooth",
        }}
      />
    </div>
  );
}
