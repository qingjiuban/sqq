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
    { token: "keyword", foreground: "8a7dff" },
    { token: "string", foreground: "7fd6a8" },
    { token: "number", foreground: "f2b544" },
    { token: "type", foreground: "6fc3ff" },
    { token: "function", foreground: "c8b6ff" },
  ],
  colors: {
    "editor.background": "#0f1117",
    "editor.foreground": "#e7e9f0",
    "editorGutter.background": "#0f1117",
    "editorLineNumber.foreground": "#3b4253",
    "editorLineNumber.activeForeground": "#98a0b3",
    "editor.lineHighlightBackground": "#151822",
    "editor.selectionBackground": "#3a3273",
    "editorCursor.foreground": "#8a7dff",
    "editorIndentGuide.background1": "#1a1e29",
    "editorIndentGuide.activeBackground1": "#2b3145",
    "editorWidget.background": "#151822",
    "editorWidget.border": "#222634",
    "editorSuggestWidget.selectedBackground": "#2a2547",
    "scrollbarSlider.background": "#262c3a80",
    "scrollbarSlider.hoverBackground": "#39415ac0",
    "minimap.background": "#0c0e14",
  },
});

loader.config({ monaco });
