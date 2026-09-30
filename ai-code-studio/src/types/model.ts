export type MessageRole = "system" | "user" | "assistant" | "tool";

export interface Message {
  role: MessageRole;
  content: string;
  name?: string;
  toolCallId?: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export type ProviderType =
  | "openai-compatible"
  | "anthropic"
  | "ollama"
  | "custom-http";

export interface ProviderCapabilities {
  streaming: boolean;
  toolCalling: boolean;
  vision: boolean;
  reasoning: boolean;
}

export interface CustomRequestConfig {
  method?: string;
  headers?: Record<string, string>;
  body?: Record<string, unknown>;
}

export interface CustomResponseConfig {
  contentPath?: string;
  finishReasonPath?: string;
  streamPath?: string;
}

export interface ModelProviderConfig {
  id: string;
  name: string;
  type: ProviderType;
  baseUrl: string;
  model: string;
  apiKey?: string;
  headers?: Record<string, string>;
  capabilities: ProviderCapabilities;
  request?: CustomRequestConfig;
  response?: CustomResponseConfig;
}

export interface ChatRequest {
  model?: string;
  messages: Message[];
  tools?: ToolDefinition[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  system?: string;
}

export type ModelEvent =
  | { type: "delta"; content: string }
  | {
      type: "tool_call";
      id: string;
      name: string;
      arguments: string;
      index?: number;
    }
  | { type: "done"; finishReason?: string }
  | { type: "error"; message: string };

export interface TestResult {
  ok: boolean;
  latencyMs: number;
  message: string;
}

export const DEFAULT_CAPABILITIES: ProviderCapabilities = {
  streaming: true,
  toolCalling: false,
  vision: false,
  reasoning: false,
};
