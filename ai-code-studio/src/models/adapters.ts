import { httpFetch } from "../lib/http";
import type {
  ChatRequest,
  ModelEvent,
  ModelProviderConfig,
  TestResult,
} from "../types/model";

export interface ModelAdapter {
  chat(
    request: ChatRequest,
    config: ModelProviderConfig,
  ): AsyncIterable<ModelEvent>;
  listModels?(config: ModelProviderConfig): Promise<string[]>;
  testConnection(config: ModelProviderConfig): Promise<TestResult>;
}

export function joinUrl(base: string, path: string): string {
  if (!base) return path;
  return `${base.replace(/\/+$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

async function* parseSse(
  response: Response,
): AsyncGenerator<Record<string, unknown>> {
  if (!response.body) return;
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let index: number;
      while ((index = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, index).trim();
        buffer = buffer.slice(index + 1);
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (!data || data === "[DONE]") continue;
        try {
          yield JSON.parse(data) as Record<string, unknown>;
        } catch {
          // ignore malformed keep-alive lines
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

async function readError(response: Response): Promise<string> {
  const text = await response.text().catch(() => "");
  return `${response.status} ${response.statusText}${text ? `: ${text.slice(0, 300)}` : ""}`;
}

/* -------------------------------------------------------------------------- */
/* OpenAI compatible adapter                                                  */
/* -------------------------------------------------------------------------- */

interface OpenAiToolCall {
  id?: string;
  index?: number;
  function?: { name?: string; arguments?: string };
}

async function* openAiChat(
  request: ChatRequest,
  config: ModelProviderConfig,
): AsyncIterable<ModelEvent> {
  const url = joinUrl(config.baseUrl, "/chat/completions");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(config.headers ?? {}),
  };
  if (config.apiKey) headers.Authorization = `Bearer ${config.apiKey}`;

  const messages = [
    ...(request.system ? [{ role: "system", content: request.system }] : []),
    ...request.messages,
  ];
  const stream = request.stream ?? config.capabilities.streaming;
  const body: Record<string, unknown> = {
    model: request.model || config.model,
    messages,
    stream,
  };
  if (request.temperature != null) body.temperature = request.temperature;
  if (request.maxTokens != null) body.max_tokens = request.maxTokens;
  if (request.tools?.length) {
    body.tools = request.tools.map((tool) => ({
      type: "function",
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      },
    }));
  }

  const response = await httpFetch()(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    yield { type: "error", message: await readError(response) };
    return;
  }

  if (!stream) {
    const json = (await response.json()) as {
      choices?: {
        message?: { content?: string; tool_calls?: OpenAiToolCall[] };
        finish_reason?: string;
      }[];
    };
    const choice = json.choices?.[0];
    const message = choice?.message;
    if (message?.content) yield { type: "delta", content: message.content };
    for (const call of message?.tool_calls ?? []) {
      yield {
        type: "tool_call",
        id: call.id ?? "",
        name: call.function?.name ?? "",
        arguments: call.function?.arguments ?? "",
        index: call.index,
      };
    }
    yield { type: "done", finishReason: choice?.finish_reason };
    return;
  }

  let finishReason: string | undefined;
  for await (const event of parseSse(response)) {
    const choices = event.choices as
      | {
          delta?: { content?: string; tool_calls?: OpenAiToolCall[] };
          finish_reason?: string | null;
        }[]
      | undefined;
    const choice = choices?.[0];
    if (!choice) continue;
    const delta = choice.delta;
    if (typeof delta?.content === "string" && delta.content) {
      yield { type: "delta", content: delta.content };
    }
    for (const call of delta?.tool_calls ?? []) {
      yield {
        type: "tool_call",
        id: call.id ?? "",
        name: call.function?.name ?? "",
        arguments: call.function?.arguments ?? "",
        index: call.index,
      };
    }
    if (choice.finish_reason) finishReason = choice.finish_reason;
  }
  yield { type: "done", finishReason };
}

export const OpenAIAdapter: ModelAdapter = {
  chat: openAiChat,

  async listModels(config) {
    const headers: Record<string, string> = { ...(config.headers ?? {}) };
    if (config.apiKey) headers.Authorization = `Bearer ${config.apiKey}`;
    const response = await httpFetch()(joinUrl(config.baseUrl, "/models"), {
      headers,
    });
    if (!response.ok) throw new Error(await readError(response));
    const json = (await response.json()) as { data?: { id?: string }[] };
    return (json.data ?? []).map((m) => m.id ?? "").filter(Boolean);
  },

  async testConnection(config) {
    const start = performance.now();
    try {
      let content = "";
      for await (const event of openAiChat(
        { messages: [{ role: "user", content: "ping" }], maxTokens: 16, stream: false },
        config,
      )) {
        if (event.type === "delta") content += event.content;
        if (event.type === "error") throw new Error(event.message);
      }
      return {
        ok: true,
        latencyMs: Math.round(performance.now() - start),
        message: content.trim() ? `Connected: ${content.trim().slice(0, 80)}` : "Connected",
      };
    } catch (error) {
      return {
        ok: false,
        latencyMs: Math.round(performance.now() - start),
        message: error instanceof Error ? error.message : String(error),
      };
    }
  },
};

/* -------------------------------------------------------------------------- */
/* Custom HTTP adapter                                                        */
/* -------------------------------------------------------------------------- */

const DEFAULT_BODY: Record<string, unknown> = {
  model: "{{model}}",
  messages: "{{messages}}",
  temperature: "{{temperature}}",
};

export function resolveJsonPath(value: unknown, path: string): unknown {
  if (!path) return value;
  const clean = path.replace(/^\$\.?/, "");
  return clean.split(".").reduce<unknown>((acc, key) => {
    if (acc == null) return undefined;
    const match = key.match(/^(.*?)\[(\d+)\]$/);
    if (match) {
      const array = (acc as Record<string, unknown>)[match[1]];
      return Array.isArray(array) ? array[Number(match[2])] : undefined;
    }
    return (acc as Record<string, unknown>)[key];
  }, value);
}

function substitute(value: unknown, vars: Record<string, unknown>): unknown {
  if (typeof value === "string") {
    const exact = value.match(/^\{\{(\w+)\}\}$/);
    if (exact) return vars[exact[1]] ?? "";
    return value.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
      const variable = vars[key];
      if (variable == null) return "";
      return typeof variable === "string" ? variable : JSON.stringify(variable);
    });
  }
  if (Array.isArray(value)) return value.map((item) => substitute(item, vars));
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      out[key] = substitute(item, vars);
    }
    return out;
  }
  return value;
}

function guessContent(value: unknown): unknown {
  const candidates = [
    "$.choices[0].message.content",
    "$.message.content",
    "$.response",
    "$.result",
    "$.content",
    "$.text",
    "$.output",
  ];
  for (const path of candidates) {
    const resolved = resolveJsonPath(value, path);
    if (typeof resolved === "string" && resolved) return resolved;
  }
  return typeof value === "string" ? value : JSON.stringify(value);
}

async function* customChat(
  request: ChatRequest,
  config: ModelProviderConfig,
): AsyncIterable<ModelEvent> {
  const variables: Record<string, unknown> = {
    apiKey: config.apiKey ?? "",
    model: request.model || config.model,
    system: request.system ?? "",
    prompt:
      [...request.messages].reverse().find((m) => m.role === "user")?.content ??
      "",
    messages: request.messages,
    temperature: request.temperature ?? "",
    maxTokens: request.maxTokens ?? "",
    tools: request.tools ?? [],
  };

  const method = config.request?.method ?? "POST";
  const headers = substitute(
    {
      "Content-Type": "application/json",
      ...(config.headers ?? {}),
      ...(config.request?.headers ?? {}),
    },
    variables,
  ) as Record<string, string>;
  const body = substitute(config.request?.body ?? DEFAULT_BODY, variables);

  const response = await httpFetch()(config.baseUrl, {
    method,
    headers,
    body: method === "GET" ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    yield { type: "error", message: await readError(response) };
    return;
  }

  const contentPath = config.response?.contentPath;

  if (request.stream) {
    const streamPath = config.response?.streamPath ?? contentPath;
    for await (const event of parseSse(response)) {
      const value = streamPath ? resolveJsonPath(event, streamPath) : event;
      if (typeof value === "string" && value) yield { type: "delta", content: value };
    }
    yield { type: "done" };
    return;
  }

  const text = await response.text();
  let parsed: unknown = text;
  try {
    parsed = JSON.parse(text);
  } catch {
    // keep raw text
  }
  const content = contentPath ? resolveJsonPath(parsed, contentPath) : guessContent(parsed);
  yield {
    type: "delta",
    content:
      content == null
        ? ""
        : typeof content === "string"
          ? content
          : JSON.stringify(content),
  };
  yield { type: "done" };
}

export const CustomAdapter: ModelAdapter = {
  chat: customChat,

  async testConnection(config) {
    const start = performance.now();
    try {
      let content = "";
      for await (const event of customChat(
        { messages: [{ role: "user", content: "ping" }], maxTokens: 16, stream: false },
        config,
      )) {
        if (event.type === "delta") content += event.content;
        if (event.type === "error") throw new Error(event.message);
      }
      return {
        ok: true,
        latencyMs: Math.round(performance.now() - start),
        message: content.trim() ? `Connected: ${content.trim().slice(0, 80)}` : "Connected",
      };
    } catch (error) {
      return {
        ok: false,
        latencyMs: Math.round(performance.now() - start),
        message: error instanceof Error ? error.message : String(error),
      };
    }
  },
};
