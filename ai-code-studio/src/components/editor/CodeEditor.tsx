import { useState } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import { useShallow } from "zustand/react/shallow";
import { useProjectStore } from "../../store/projectStore";
import { languageFromPath } from "../../lib/api";
import { IconCode } from "../ui/icons";

export default function CodeEditor() {
  const { tabs, activePath, updateActiveContent } = useProjectStore(
    useShallow((s) => ({
      tabs: s.tabs,
      activePath: s.activePath,
      updateActiveContent: s.updateActiveContent,
    })),
  );
  const [cursor, setCursor] = useState<{ line: number; column: number } | null>(
    null,
  );
  const activeTab = tabs.find((t) => t.path === activePath) ?? null;

  if (!activeTab) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-[var(--color-canvas)]">
        <span className="grid h-11 w-11 place-items-center rounded-[var(--radius-panel)] bg-[var(--color-surface)] text-[var(--color-text-disabled)]">
          <IconCode size={20} />
        </span>
        <div className="flex flex-col items-center gap-1 text-center">
          <span className="text-sm font-medium text-[var(--color-text-secondary)]">
            未打开文件
          </span>
          <span className="text-xs text-[var(--color-text-muted)]">
            从资源管理器中选择一个文件开始编辑
          </span>
        </div>
      </div>
    );
  }

  const language = languageFromPath(activeTab.path);

  const handleMount: OnMount = (editor) => {
    editor.onDidChangeCursorPosition((event) => {
      setCursor({
        line: event.position.lineNumber,
        column: event.position.column,
      });
    });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[var(--color-canvas)]">
      <div className="min-h-0 flex-1">
        <Editor
          height="100%"
          theme="acs-dark"
          language={language}
          path={activeTab.path}
          value={activeTab.content}
          onChange={(value) => updateActiveContent(value ?? "")}
          onMount={handleMount}
          options={{
            fontSize: 13,
            fontFamily:
              "ui-monospace, SFMono-Regular, Menlo, Consolas, \"Sarasa Mono SC\", \"Noto Sans Mono CJK SC\", \"PingFang SC\", \"Microsoft YaHei\", monospace",
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
      <div className="flex h-6 shrink-0 items-center gap-3 border-t border-[var(--color-border-subtle)] bg-[var(--color-surface)] px-3 text-[11px] text-[var(--color-text-muted)]">
        <span className="truncate">{activeTab.path}</span>
        <span className="ml-auto flex shrink-0 items-center gap-3">
          {activeTab.dirty && (
            <span className="text-[var(--color-warning)]">未保存</span>
          )}
          {cursor && (
            <span>
              行 {cursor.line}, 列 {cursor.column}
            </span>
          )}
          <span>{language}</span>
          <span>UTF-8</span>
        </span>
      </div>
    </div>
  );
}
