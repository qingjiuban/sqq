import type { ToolCall } from "../types/tools";

export interface ParsedAssistant {
  text: string;
  calls: ToolCall[];
}

let counter = 0;
function nextId(): string {
  counter += 1;
  return `call_${Date.now().toString(36)}_${counter}`;
}

function toArguments(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object") return value as Record<string, unknown>;
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object") {
        return parsed as Record<string, unknown>;
      }
    } catch {
      // fall through
    }
  }
  return {};
}

/** Parse a single JSON object that describes a tool call. */
function fromObject(value: unknown): ToolCall | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const name = (record.name ?? record.tool ?? record.tool_name) as unknown;
  if (typeof name !== "string" || !name) return null;
  const args = record.arguments ?? record.parameters ?? record.args ?? {};
  return { id: nextId(), name, arguments: toArguments(args) };
}

/**
 * Parse an assistant message that may contain tool calls expressed as
 *   - native structured calls (handled by the caller, not here)
 *   - JSON blocks:      ```json { "name": "read_file", "arguments": {...} } ```
 *   - text protocol:    <tool_call>{ "name": "...", "arguments": {...} }</tool_call>
 *   - a bare JSON object that is the entire message
 * The human-readable text with the tool call syntax removed is returned too.
 */
export function parseAssistantText(raw: string): ParsedAssistant {
  const calls: ToolCall[] = [];
  let text = raw;

  // Mode C: explicit <tool_call> tags
  const tagPattern = /<tool_call>([\s\S]*?)<\/tool_call>/gi;
  text = text.replace(tagPattern, (_match, inner: string) => {
    const call = fromObject(safeJson(inner.trim()));
    if (call) calls.push(call);
    return "";
  });

  // Mode B: fenced JSON blocks
  const fencePattern = /```(?:json)?\s*([\s\S]*?)```/gi;
  text = text.replace(fencePattern, (match, inner: string) => {
    const call = fromObject(safeJson(inner.trim()));
    if (call) {
      calls.push(call);
      return "";
    }
    return match;
  });

  // A bare JSON object spanning the whole message
  if (calls.length === 0) {
    const trimmed = text.trim();
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      const call = fromObject(safeJson(trimmed));
      if (call) {
        calls.push(call);
        text = "";
      }
    }
  }

  return { text: text.replace(/\n{3,}/g, "\n\n").trim(), calls };
}

function safeJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

/**
 * Accumulates streaming native tool-call fragments. Providers may split the
 * arguments JSON across many deltas, so fragments are concatenated per call id
 * and only parsed once the stream has finished.
 */
export class NativeToolCallAccumulator {
  private order: string[] = [];
  private calls = new Map<string, { name: string; args: string }>();
  private ids = new Map<string, string>();

  push(id: string, name: string, argumentsFragment: string, index?: number): void {
    // OpenAI streams tool calls with a stable `index` but only sends `id` on
    // the first fragment, so prefer index (then id) as the grouping key.
    const key = index != null ? `idx_${index}` : id || `anon_${this.order.length}`;
    if (!this.calls.has(key)) {
      this.calls.set(key, { name: "", args: "" });
      this.order.push(key);
    }
    const entry = this.calls.get(key)!;
    if (name) entry.name = name;
    if (argumentsFragment) entry.args += argumentsFragment;
    if (id && !this.ids.has(key)) this.ids.set(key, id);
  }

  finish(): ToolCall[] {
    return this.order
      .map((key) => {
        const entry = this.calls.get(key)!;
        if (!entry.name) return null;
        return {
          id: this.ids.get(key) || nextId(),
          name: entry.name,
          arguments: toArguments(entry.args),
        } satisfies ToolCall;
      })
      .filter((call): call is ToolCall => call !== null);
  }
}
