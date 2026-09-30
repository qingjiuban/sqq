export type ToolPermission = "read" | "write" | "execute";

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolResult {
  toolCallId: string;
  success: boolean;
  output: unknown;
  error?: { code: string; message: string };
}

export interface AgentTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  permission: ToolPermission;
  execute(input: Record<string, unknown>): Promise<unknown>;
}

export function asString(input: Record<string, unknown>, key: string): string {
  const value = input[key];
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Missing required string argument "${key}"`);
  }
  return value;
}
