import { getTool } from "./ToolRegistry";
import type { ToolCall, ToolResult } from "../types/tools";

export async function executeToolCall(call: ToolCall): Promise<ToolResult> {
  const tool = getTool(call.name);
  if (!tool) {
    return {
      toolCallId: call.id,
      success: false,
      output: null,
      error: { code: "unknown_tool", message: `Unknown tool "${call.name}"` },
    };
  }
  try {
    const output = await tool.execute(call.arguments);
    return { toolCallId: call.id, success: true, output };
  } catch (error) {
    return {
      toolCallId: call.id,
      success: false,
      output: null,
      error: {
        code: "tool_error",
        message: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

export function stringifyResult(result: ToolResult): string {
  if (!result.success) {
    return `Error (${result.error?.code ?? "error"}): ${result.error?.message ?? "unknown"}`;
  }
  const output = result.output;
  if (typeof output === "string") return output;
  try {
    return JSON.stringify(output, null, 2);
  } catch {
    return String(output);
  }
}

/** One-line summary shown in the agent progress log. */
export function summarizeResult(result: ToolResult): string {
  if (!result.success) return result.error?.message ?? "failed";
  const output = result.output as Record<string, unknown> | null;
  if (!output || typeof output !== "object") return "done";
  if (typeof output.running === "boolean") {
    return output.running
      ? `running (${output.processId ?? "process"})`
      : `exit ${output.exitCode ?? "?"}`;
  }
  if (typeof output.path === "string") {
    return output.path;
  }
  if (typeof output.count === "number") {
    return `${output.count} items`;
  }
  if (typeof output.killed === "boolean") {
    return output.killed ? "stopped" : "not found";
  }
  return "done";
}
