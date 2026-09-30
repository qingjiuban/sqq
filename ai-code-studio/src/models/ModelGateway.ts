import { secretStore } from "../lib/secrets";
import type {
  ChatRequest,
  ModelEvent,
  ModelProviderConfig,
  TestResult,
} from "../types/model";
import { CustomAdapter, OpenAIAdapter, type ModelAdapter } from "./adapters";

function adapterFor(type: ModelProviderConfig["type"]): ModelAdapter {
  switch (type) {
    case "custom-http":
      return CustomAdapter;
    case "openai-compatible":
    case "ollama":
    case "anthropic":
    default:
      // Anthropic support lands in a later phase; until then these fall back
      // to the OpenAI compatible protocol.
      return OpenAIAdapter;
  }
}

async function withApiKey(
  config: ModelProviderConfig,
): Promise<ModelProviderConfig> {
  if (config.apiKey) return config;
  const stored = await secretStore.get(config.id);
  return stored ? { ...config, apiKey: stored } : config;
}

export const ModelGateway = {
  async *chat(
    config: ModelProviderConfig,
    request: ChatRequest,
  ): AsyncIterable<ModelEvent> {
    const resolved = await withApiKey(config);
    yield* adapterFor(resolved.type).chat(request, resolved);
  },

  async testConnection(config: ModelProviderConfig): Promise<TestResult> {
    const resolved = await withApiKey(config);
    return adapterFor(resolved.type).testConnection(resolved);
  },

  async listModels(config: ModelProviderConfig): Promise<string[]> {
    const resolved = await withApiKey(config);
    const adapter = adapterFor(resolved.type);
    if (!adapter.listModels) {
      throw new Error("This provider does not support listing models");
    }
    return adapter.listModels(resolved);
  },
};
