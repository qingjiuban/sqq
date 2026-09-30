import { getProcessOutput, killProcess, runCommand } from "../lib/commandApi";
import { asString, type AgentTool } from "../types/tools";

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item));
}

function formatOutput(result: {
  exitCode: number | null;
  running: boolean;
  timedOut?: boolean;
  stdout: string;
  stderr: string;
}): string {
  const parts: string[] = [];
  if (result.running) {
    parts.push("(process is still running in the background)");
  } else if (result.timedOut) {
    parts.push("(command timed out)");
  } else {
    parts.push(`exit code: ${result.exitCode ?? "unknown"}`);
  }
  if (result.stdout.trim()) parts.push(`stdout:\n${result.stdout.trimEnd()}`);
  if (result.stderr.trim()) parts.push(`stderr:\n${result.stderr.trimEnd()}`);
  return parts.join("\n");
}

export const runCommandTool: AgentTool = {
  name: "run_command",
  description:
    "Run a development command (build, test, lint, git) inside the project root and capture its output. " +
    "Only whitelisted executables (node, npm, pnpm, git, cargo, ...) are allowed and shell metacharacters are rejected. " +
    "Long-running commands return early with a processId that can be polled with get_process_output.",
  permission: "execute",
  inputSchema: {
    type: "object",
    properties: {
      command: {
        type: "string",
        description: "Bare executable name, e.g. npm, pnpm, git, cargo. Not a path.",
      },
      args: {
        type: "array",
        items: { type: "string" },
        description: "Argument list, e.g. [\"run\", \"build\"]",
      },
      timeoutMs: {
        type: "number",
        description: "How long to wait before returning a background process (default 30000).",
      },
    },
    required: ["command"],
  },
  async execute(input) {
    const command = asString(input, "command");
    const args = toStringArray(input.args);
    const timeoutMs =
      typeof input.timeoutMs === "number" ? input.timeoutMs : undefined;
    const result = await runCommand(command, args, timeoutMs);
    return {
      processId: result.processId,
      command: result.command,
      running: result.running,
      timedOut: result.timedOut,
      exitCode: result.exitCode,
      output: formatOutput(result),
    };
  },
};

export const getProcessOutputTool: AgentTool = {
  name: "get_process_output",
  description:
    "Read the current output of a background process started by run_command, or its exit code once it has finished.",
  permission: "execute",
  inputSchema: {
    type: "object",
    properties: {
      processId: { type: "string", description: "Id returned by run_command" },
    },
    required: ["processId"],
  },
  async execute(input) {
    const processId = asString(input, "processId");
    const result = await getProcessOutput(processId);
    return {
      processId: result.processId,
      command: result.command,
      running: result.running,
      exitCode: result.exitCode,
      output: formatOutput(result),
    };
  },
};

export const killProcessTool: AgentTool = {
  name: "kill_process",
  description: "Stop a background process started by run_command.",
  permission: "execute",
  inputSchema: {
    type: "object",
    properties: {
      processId: { type: "string", description: "Id returned by run_command" },
    },
    required: ["processId"],
  },
  async execute(input) {
    const processId = asString(input, "processId");
    const killed = await killProcess(processId);
    return { processId, killed };
  },
};
