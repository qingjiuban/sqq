import { ModelGateway } from "../models/ModelGateway";
import { permissionManager, type PermissionLevel } from "../security/PermissionManager";
import type { Message, ModelProviderConfig } from "../types/model";
import type { ToolCall, ToolResult } from "../types/tools";
import { buildSystemPrompt } from "./AgentContext";
import { NativeToolCallAccumulator, parseAssistantText } from "./ToolParser";
import { allTools, getTool } from "./ToolRegistry";
import { executeToolCall, stringifyResult } from "./ToolExecutor";
import { runVerification } from "./verify";

export type AgentStatus =
  | "idle"
  | "thinking"
  | "streaming"
  | "calling-tool"
  | "waiting-approval"
  | "done"
  | "error";

const COMMAND_TOOLS = new Set([
  "run_command",
  "get_process_output",
  "kill_process",
]);

export type AgentEvent =
  | { type: "status"; status: AgentStatus }
  | { type: "delta"; content: string }
  | { type: "message"; message: Message }
  | { type: "tool-start"; call: ToolCall }
  | { type: "tool-end"; call: ToolCall; result: ToolResult }
  | { type: "await-approval"; call: ToolCall }
  | { type: "terminal"; entry: TerminalEventEntry }
  | { type: "notice"; content: string }
  | { type: "done" }
  | { type: "error"; message: string };

export interface TerminalEventEntry {
  command: string;
  output: string;
  running: boolean;
  exitCode: number | null;
  timedOut: boolean;
}

export interface AgentRunOptions {
  provider: ModelProviderConfig;
  history: Message[];
  projectName: string;
  maxIterations?: number;
  level?: PermissionLevel;
  /** Run build/test after the agent finishes editing and feed failures back. */
  autoVerify?: boolean;
  maxRepairRounds?: number;
}

export type ApprovalResolver = (
  call: ToolCall,
) => Promise<boolean>;

/**
 * Drives the agent loop:
 *   build context -> call model -> parse tool calls -> execute -> feed results
 * until the model answers without a tool call or maxIterations is reached.
 */
export async function* runAgent(
  options: AgentRunOptions,
  approve: ApprovalResolver,
): AsyncGenerator<AgentEvent> {
  const tools = allTools();
  const system = buildSystemPrompt(tools, options.projectName);
  const maxIterations = options.maxIterations ?? 30;
  const messages: Message[] = [...options.history];
  if (options.level != null) permissionManager.setLevel(options.level);

  const toolDefs = tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    parameters: tool.inputSchema,
  }));

  let repairRounds = 0;
  let pendingVerification = false;

  for (let iteration = 0; iteration < maxIterations; iteration += 1) {
    yield { type: "status", status: "thinking" };

    let text = "";
    const accumulator = new NativeToolCallAccumulator();
    let streamed = false;

    try {
      for await (const event of ModelGateway.chat(options.provider, {
        messages,
        tools: toolDefs,
        system,
        stream: options.provider.capabilities.streaming,
      })) {
        if (event.type === "delta") {
          if (!streamed) {
            streamed = true;
            yield { type: "status", status: "streaming" };
          }
          text += event.content;
          yield { type: "delta", content: event.content };
        } else if (event.type === "tool_call") {
          accumulator.push(event.id, event.name, event.arguments, event.index);
        } else if (event.type === "error") {
          yield { type: "error", message: event.message };
          yield { type: "status", status: "error" };
          return;
        }
      }
    } catch (error) {
      yield {
        type: "error",
        message: error instanceof Error ? error.message : String(error),
      };
      yield { type: "status", status: "error" };
      return;
    }

    const nativeCalls = accumulator.finish();
    const parsed = parseAssistantText(text);
    const calls = nativeCalls.length ? nativeCalls : parsed.calls;
    const assistantText = parsed.text;

    if (calls.length === 0) {
      if (
        pendingVerification &&
        options.autoVerify &&
        repairRounds < (options.maxRepairRounds ?? 2)
      ) {
        pendingVerification = false;
        repairRounds += 1;
        yield {
          type: "notice",
          content: `Running project verification (round ${repairRounds})…`,
        };
        const outcomes = await runVerification();
        if (outcomes.length === 0) {
          // Nothing to verify in this project; fall through to completion.
        } else {
          const failed = outcomes.find((outcome) => !outcome.passed);
          if (!failed) {
            yield {
              type: "notice",
              content: `Verification passed: ${outcomes
                .map((outcome) => outcome.step.label)
                .join(", ")}.`,
            };
          } else {
            const transcript = outcomes
              .map(
                (outcome) =>
                  `$ ${outcome.step.command} ${outcome.step.args.join(" ")} → ${
                    outcome.passed ? "passed" : "FAILED"
                  }\n${outcome.output.slice(-4000)}`,
              )
              .join("\n\n");
            yield {
              type: "terminal",
              entry: {
                command: `${failed.step.command} ${failed.step.args.join(" ")}`,
                output: transcript,
                running: false,
                exitCode: 1,
                timedOut: false,
              },
            };
            yield {
              type: "notice",
              content: `Verification failed at "${failed.step.label}". Asking the model to fix it…`,
            };
            messages.push({
              role: "user",
              content: [
                `Project verification failed at "${failed.step.label}".`,
                "Here is the command output:",
                "```",
                transcript,
                "```",
                "Fix the root cause with the available tools, then stop.",
              ].join("\n"),
            });
            continue;
          }
        }
      }
      const finalMessage: Message = { role: "assistant", content: assistantText };
      messages.push(finalMessage);
      yield { type: "message", message: finalMessage };
      yield { type: "status", status: "done" };
      yield { type: "done" };
      return;
    }

    messages.push({ role: "assistant", content: assistantText });
    yield { type: "message", message: { role: "assistant", content: assistantText } };

    for (const call of calls) {
      const tool = getTool(call.name);
      if (!tool) {
        const result: ToolResult = {
          toolCallId: call.id,
          success: false,
          output: null,
          error: { code: "unknown_tool", message: `Unknown tool "${call.name}"` },
        };
        yield { type: "tool-start", call };
        yield { type: "tool-end", call, result };
        messages.push(toolResultMessage(call, result));
        continue;
      }

      const decision = permissionManager.check(tool.permission);
      if (!decision.allowed) {
        yield { type: "notice", content: decision.reason ?? "Not allowed" };
        const result: ToolResult = {
          toolCallId: call.id,
          success: false,
          output: null,
          error: { code: "permission_denied", message: decision.reason ?? "Not allowed" },
        };
        yield { type: "tool-start", call };
        yield { type: "tool-end", call, result };
        messages.push(toolResultMessage(call, result));
        continue;
      }

      yield { type: "tool-start", call };

      if (decision.requiresApproval) {
        yield { type: "status", status: "waiting-approval" };
        yield { type: "await-approval", call };
        const approved = await approve(call);
        if (!approved) {
          const result: ToolResult = {
            toolCallId: call.id,
            success: false,
            output: null,
            error: { code: "user_denied", message: "The user denied this tool call." },
          };
          yield { type: "tool-end", call, result };
          messages.push(toolResultMessage(call, result));
          continue;
        }
      }

      yield { type: "status", status: "calling-tool" };
      const result = await executeToolCall(call);
      yield { type: "tool-end", call, result };
      if (tool.permission === "write" && result.success) {
        pendingVerification = true;
      }
      if (COMMAND_TOOLS.has(call.name) && result.success) {
        const detail = result.output as {
          command?: unknown;
          output?: unknown;
          running?: unknown;
          exitCode?: unknown;
          timedOut?: unknown;
        } | null;
        if (detail && typeof detail.output === "string") {
          yield {
            type: "terminal",
            entry: {
              command:
                typeof detail.command === "string" ? detail.command : call.name,
              output: detail.output,
              running: detail.running === true,
              exitCode:
                typeof detail.exitCode === "number" ? detail.exitCode : null,
              timedOut: detail.timedOut === true,
            },
          };
        }
      }
      messages.push(toolResultMessage(call, result));
    }
  }

  yield {
    type: "notice",
    content: `Reached the maximum of ${maxIterations} iterations and stopped.`,
  };
  yield { type: "status", status: "done" };
  yield { type: "done" };
}

function toolResultMessage(call: ToolCall, result: ToolResult): Message {
  return {
    role: "user",
    content: `Tool result for ${call.name}:\n${stringifyResult(result)}`,
    name: call.name,
    toolCallId: call.id,
  };
}
