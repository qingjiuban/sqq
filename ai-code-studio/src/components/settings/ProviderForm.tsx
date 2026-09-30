import { useState } from "react";
import { ModelGateway } from "../../models/ModelGateway";
import { useModelStore } from "../../store/modelStore";
import {
  DEFAULT_CAPABILITIES,
  type ModelProviderConfig,
  type ProviderCapabilities,
  type ProviderType,
} from "../../types/model";

const TYPE_OPTIONS: { value: ProviderType; label: string }[] = [
  { value: "openai-compatible", label: "OpenAI Compatible" },
  { value: "custom-http", label: "Custom HTTP" },
  { value: "ollama", label: "Ollama" },
  { value: "anthropic", label: "Anthropic" },
];

const CAPABILITY_LABELS: Record<keyof ProviderCapabilities, string> = {
  streaming: "Streaming",
  toolCalling: "Tool Calling",
  vision: "Vision",
  reasoning: "Reasoning",
};

function emptyConfig(): ModelProviderConfig {
  return {
    id: crypto.randomUUID(),
    name: "New Provider",
    type: "openai-compatible",
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-4o-mini",
    apiKey: "",
    capabilities: { ...DEFAULT_CAPABILITIES },
  };
}

interface ProviderFormProps {
  initial?: ModelProviderConfig;
  onDone: () => void;
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

const inputClass = "input text-[12.5px]";

export default function ProviderForm({ initial, onDone }: ProviderFormProps) {
  const upsertProvider = useModelStore((s) => s.upsertProvider);
  const [config, setConfig] = useState<ModelProviderConfig>(
    initial ?? emptyConfig(),
  );
  const [headersText, setHeadersText] = useState(
    initial?.headers ? JSON.stringify(initial.headers, null, 2) : "",
  );
  const [requestText, setRequestText] = useState(
    initial?.request ? JSON.stringify(initial.request, null, 2) : "",
  );
  const [responseText, setResponseText] = useState(
    initial?.response ? JSON.stringify(initial.response, null, 2) : "",
  );
  const [status, setStatus] = useState("");
  const [models, setModels] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const patch = (partial: Partial<ModelProviderConfig>) =>
    setConfig((current) => ({ ...current, ...partial }));

  const buildConfig = (): ModelProviderConfig => {
    const next: ModelProviderConfig = { ...config };
    if (headersText.trim()) {
      try {
        next.headers = JSON.parse(headersText);
      } catch {
        throw new Error("Headers must be valid JSON");
      }
    } else {
      delete next.headers;
    }
    if (config.type === "custom-http" && requestText.trim()) {
      try {
        next.request = JSON.parse(requestText);
      } catch {
        throw new Error("Request template must be valid JSON");
      }
    } else if (config.type !== "custom-http") {
      delete next.request;
    }
    if (config.type === "custom-http" && responseText.trim()) {
      try {
        next.response = JSON.parse(responseText);
      } catch {
        throw new Error("Response mapping must be valid JSON");
      }
    } else if (config.type !== "custom-http") {
      delete next.response;
    }
    return next;
  };

  const run = async (task: (next: ModelProviderConfig) => Promise<void>) => {
    setBusy(true);
    try {
      await task(buildConfig());
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  };

  const handleSave = () =>
    run(async (next) => {
      await upsertProvider(next);
      onDone();
    });

  const handleTest = () =>
    run(async (next) => {
      setStatus("Testing...");
      const result = await ModelGateway.testConnection(next);
      setStatus(
        `${result.ok ? "OK" : "FAILED"} (${result.latencyMs}ms) — ${result.message}`,
      );
    });

  const handleListModels = () =>
    run(async (next) => {
      setStatus("Fetching models...");
      const list = await ModelGateway.listModels(next);
      setModels(list);
      setStatus(`Found ${list.length} models`);
    });

  return (
    <div className="flex flex-col gap-3 overflow-y-auto p-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Name">
          <input
            className={inputClass}
            value={config.name}
            onChange={(e) => patch({ name: e.target.value })}
          />
        </Field>
        <Field label="Type">
          <select
            className={inputClass}
            value={config.type}
            onChange={(e) => patch({ type: e.target.value as ProviderType })}
          >
            {TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field
        label={config.type === "custom-http" ? "Endpoint URL" : "Base URL"}
      >
        <input
          className={inputClass}
          value={config.baseUrl}
          onChange={(e) => patch({ baseUrl: e.target.value })}
          placeholder="https://api.example.com/v1"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Model">
          <input
            className={inputClass}
            list="acs-model-list"
            value={config.model}
            onChange={(e) => patch({ model: e.target.value })}
          />
          <datalist id="acs-model-list">
            {models.map((model) => (
              <option key={model} value={model} />
            ))}
          </datalist>
        </Field>
        <Field label="API Key">
          <input
            className={inputClass}
            type="password"
            value={config.apiKey ?? ""}
            onChange={(e) => patch({ apiKey: e.target.value })}
            placeholder="sk-..."
          />
        </Field>
      </div>

      <Field label="Capabilities">
        <div className="flex flex-wrap gap-3 pt-1">
          {(Object.keys(CAPABILITY_LABELS) as (keyof ProviderCapabilities)[]).map(
            (key) => (
              <label
                key={key}
                className="flex items-center gap-1.5 text-[12px] text-[var(--color-dim)]"
              >
                <input
                  type="checkbox"
                  className="accent-[var(--color-iris)]"
                  checked={config.capabilities[key]}
                  onChange={(e) =>
                    patch({
                      capabilities: {
                        ...config.capabilities,
                        [key]: e.target.checked,
                      },
                    })
                  }
                />
                {CAPABILITY_LABELS[key]}
              </label>
            ),
          )}
        </div>
      </Field>

      <Field label="Extra Headers (JSON, optional)">
        <textarea
          className={`${inputClass} h-16 font-mono text-xs`}
          value={headersText}
          onChange={(e) => setHeadersText(e.target.value)}
          placeholder='{ "X-Org": "abc" }'
        />
      </Field>

      {config.type === "custom-http" && (
        <>
          <Field label="Request Template (JSON)">
            <textarea
              className={`${inputClass} h-28 font-mono text-xs`}
              value={requestText}
              onChange={(e) => setRequestText(e.target.value)}
              placeholder={
                '{\n  "method": "POST",\n  "headers": { "Authorization": "Bearer {{apiKey}}" },\n  "body": { "model": "{{model}}", "messages": "{{messages}}" }\n}'
              }
            />
          </Field>
          <Field label="Response Mapping (JSON)">
            <textarea
              className={`${inputClass} h-20 font-mono text-xs`}
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              placeholder='{ "contentPath": "$.result", "streamPath": "$.delta" }'
            />
          </Field>
        </>
      )}

      <div className="flex items-center gap-2 pt-1">
        <button className="btn btn-primary" onClick={handleSave} disabled={busy}>
          Save
        </button>
        <button className="btn btn-outline" onClick={handleTest} disabled={busy}>
          Test Connection
        </button>
        {config.type !== "custom-http" && (
          <button
            className="btn btn-outline"
            onClick={handleListModels}
            disabled={busy}
          >
            Fetch Models
          </button>
        )}
      </div>

      {status && (
        <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-ink)] px-3 py-2 font-mono text-[11px] whitespace-pre-wrap text-[var(--color-dim)]">
          {status}
        </div>
      )}
    </div>
  );
}
