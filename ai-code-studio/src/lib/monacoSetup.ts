import { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import editorWorker from "../monacoWorkers/editor.worker?worker";
import cssWorker from "../monacoWorkers/css.worker?worker";
import htmlWorker from "../monacoWorkers/html.worker?worker";
import jsonWorker from "../monacoWorkers/json.worker?worker";
import tsWorker from "../monacoWorkers/ts.worker?worker";

self.MonacoEnvironment = {
  getWorker(_workerId: string, label: string) {
    if (label === "json") return new jsonWorker();
    if (label === "css" || label === "scss" || label === "less") return new cssWorker();
    if (label === "html" || label === "handlebars" || label === "razor") return new htmlWorker();
    if (label === "typescript" || label === "javascript") return new tsWorker();
    return new editorWorker();
  },
};

monaco.editor.defineTheme("acs-dark", {
  base: "vs-dark",
  inherit: true,
  rules: [
    { token: "comment", foreground: "5b6478", fontStyle: "italic" },
    { token: "keyword", foreground: "7d92ff" },
    { token: "string", foreground: "7fd6a8" },
    { token: "number", foreground: "e6b04a" },
    { token: "type", foreground: "6fc3ff" },
    { token: "function", foreground: "c2b6ff" },
  ],
  colors: {
    "editor.background": "#0b0d11",
    "editor.foreground": "#e7eaf0",
    "editorGutter.background": "#0b0d11",
    "editorLineNumber.foreground": "#3b4250",
    "editorLineNumber.activeForeground": "#9ba3b2",
    "editor.lineHighlightBackground": "#12151b",
    "editor.selectionBackground": "#2b3566",
    "editorCursor.foreground": "#5b76f7",
    "editorIndentGuide.background1": "#171b23",
    "editorIndentGuide.activeBackground1": "#2d3440",
    "editorWidget.background": "#14181e",
    "editorWidget.border": "#20252e",
    "editorSuggestWidget.selectedBackground": "#1d2547",
    "scrollbarSlider.background": "#262c3680",
    "scrollbarSlider.hoverBackground": "#39415ac0",
    "minimap.background": "#0a0c10",
  },
});

loader.config({ monaco });
