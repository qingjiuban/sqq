import Editor from "@monaco-editor/react";
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
  const activeTab = tabs.find((t) => t.path === activePath) ?? null;

  if (!activeTab) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-[var(--color-ink)]">
        <span className="grid h-11 w-11 place-items-center rounded-[12px] bg-[var(--color-panel)] text-[var(--color-faint)]">
          <IconCode size={20} />
        </span>
        <div className="flex flex-col items-center gap-1 text-center">
          <span className="text-sm font-medium text-[var(--color-dim)]">
            未打开文件
          </span>
          <span className="text-xs text-[var(--color-mute)]">
            从资源管理器中选择一个文件开始编辑
          </span>
        </div>
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
  );
}
