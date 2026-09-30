import type { AgentTool } from "../types/tools";
import { canExecuteCommands } from "../lib/platform";

function describeTool(tool: AgentTool): string {
  return `- ${tool.name}: ${tool.description}\n  input schema: ${JSON.stringify(
    tool.inputSchema,
  )}`;
}

export function buildSystemPrompt(
  tools: AgentTool[],
  projectName: string,
): string {
  const canRunCommands = canExecuteCommands();
  const lines = [
    "You are AI Code Studio, an autonomous coding agent operating on the user's local project.",
    `The user has the project "${projectName}" open in the editor.`,
    "",
    "You can read, create and modify files inside the project using the tools below.",
  ];

  if (canRunCommands) {
    lines.push(
      "You can also run development commands (build, test, lint, git) with run_command.",
      "Commands run inside the project root with no shell; shell metacharacters are rejected.",
      "After editing code, prefer running the project's build or test command to verify your change.",
    );
  } else {
    lines.push(
      "Running shell commands is unavailable on this platform, so rely on file edits and careful reasoning.",
    );
  }

  lines.push(
    "Always inspect existing files before editing them, and prefer edit_file over rewriting whole files.",
    "When the user asks for code, make the change with the tools instead of only describing it.",
    "",
    "## Tools",
    ...tools.map(describeTool),
    "",
    "## How to call a tool",
    "If the API supports native tool calling, use it.",
    "Otherwise emit exactly one of the following forms and nothing else in the same message:",
    '<tool_call>{"name": "read_file", "arguments": {"path": "src/App.tsx"}}</tool_call>',
    '```json\n{"name": "edit_file", "arguments": {"path": "src/App.tsx", "edits": [{"old": "a", "new": "b"}]}}\n```',
    "",
    "After a tool runs you will receive its result and may continue.",
    "When the task is complete, reply with a short summary and no tool call.",
  );

  return lines.join("\n");
}
