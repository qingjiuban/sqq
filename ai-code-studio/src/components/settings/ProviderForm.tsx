import { useState } from "react";
import { ModelGateway } from "../../models/ModelGateway";
import { useModelStore } from "../../store/modelStore";
import {
  DEFAULT_CAPABILITIES,
  type ModelProviderConfig,
  type ProviderCapabilities,
  type ProviderType,
} from "../../types/model";
import { IconCheck, IconCopy, IconEye, IconEyeOff } from "../ui/icons";
import { StatusDot } from "../ui/Status";

const TYPE_OPTIONS: { value: ProviderType; label: string }[] = [
  { value: "openai-compatible", label: "OpenAI 兼容" },
  { value: "custom-http", label: "自定义 HTTP" },
  { value: "ollama", label: "Ollama" },
  { value: "anthropic", label: "Anthropic" },
];

const CAPABILITY_LABELS: Record<keyof ProviderCapabilities, string> = {
  streaming: "流式输出",
  toolCalling: "工具调用",
  vision: "视觉",
  reasoning: "推理",
};

function emptyConfig(): ModelProviderConfig {
  return {
    id: crypto.randomUUID(),
    name: "新建服务商",
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
      <span className="field-label">{label}</span>
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
  const [statusOk, setStatusOk] = useState<boolean | null>(null);
  const [models, setModels] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [reveal, setReveal] = useState(false);
  const [copied, setCopied] = useState(false);

  const patch = (partial: Partial<ModelProviderConfig>) =>
    setConfig((current) => ({ ...current, ...partial }));

  const buildConfig = (): ModelProviderConfig => {
    const next: ModelProviderConfig = { ...config };
    if (headersText.trim()) {
      try {
        next.headers = JSON.parse(headersText);
      } catch {
        throw new Error("请求头必须是合法的 JSON");
      }
    } else {
      delete next.headers;
    }
    if (config.type === "custom-http" && requestText.trim()) {
      try {
        next.request = JSON.parse(requestText);
      } catch {
        throw new Error("请求模板必须是合法的 JSON");
      }
    } else if (config.type !== "custom-http") {
      delete next.request;
    }
    if (config.type === "custom-http" && responseText.trim()) {
      try {
        next.response = JSON.parse(responseText);
      } catch {
        throw new Error("响应映射必须是合法的 JSON");
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
      setStatusOk(false);
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
      setStatusOk(null);
      setStatus("测试中…");
      const result = await ModelGateway.testConnection(next);
      setStatusOk(result.ok);
      setStatus(
        `${result.ok ? "连接成功" : "连接失败"} (${result.latencyMs}ms) — ${result.message}`,
      );
    });

  const handleListModels = () =>
    run(async (next) => {
      setStatusOk(null);
      setStatus("正在获取模型…");
      const list = await ModelGateway.listModels(next);
      setModels(list);
      setStatusOk(true);
      setStatus(`共找到 ${list.length} 个模型`);
    });

  const handleCopy = async () => {
    if (!config.apiKey) return;
    try {
      await navigator.clipboard.writeText(config.apiKey);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable; ignore
    }
  };

  return (
    <div className="flex flex-col gap-3 overflow-y-auto p-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="名称">
          <input
            className={inputClass}
            value={config.name}
            onChange={(e) => patch({ name: e.target.value })}
          />
        </Field>
        <Field label="类型">
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

      <Field label={config.type === "custom-http" ? "接口地址" : "Base URL"}>
        <input
          className={inputClass}
          value={config.baseUrl}
          onChange={(e) => patch({ baseUrl: e.target.value })}
          placeholder="https://api.example.com/v1"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="模型">
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
          <div className="relative">
            <input
              className={`${inputClass} pr-16`}
              type={reveal ? "text" : "password"}
              value={config.apiKey ?? ""}
              onChange={(e) => patch({ apiKey: e.target.value })}
              placeholder="sk-..."
            />
            <div className="absolute inset-y-0 right-1 flex items-center gap-0.5">
              <button
                type="button"
                className="btn-icon !h-6 !w-6"
                onClick={() => setReveal((v) => !v)}
                title={reveal ? "隐藏" : "显示"}
                aria-label={reveal ? "隐藏" : "显示"}
              >
                {reveal ? <IconEyeOff size={14} /> : <IconEye size={14} />}
              </button>
              <button
                type="button"
                className="btn-icon !h-6 !w-6"
                onClick={handleCopy}
                disabled={!config.apiKey}
                title="复制"
                aria-label="复制"
              >
                {copied ? (
                  <IconCheck size={14} className="text-[var(--color-success)]" />
                ) : (
                  <IconCopy size={14} />
                )}
              </button>
            </div>
          </div>
        </Field>
      </div>

      <Field label="能力">
        <div className="flex flex-wrap gap-3 pt-1">
          {(Object.keys(CAPABILITY_LABELS) as (keyof ProviderCapabilities)[]).map(
            (key) => (
              <label
                key={key}
                className="flex items-center gap-1.5 text-[12px] text-[var(--color-text-secondary)]"
              >
                <input
                  type="checkbox"
                  className="accent-[var(--color-accent)]"
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

      <Field label="额外请求头 (JSON，可选)">
        <textarea
          className={`${inputClass} h-16 font-mono text-xs`}
          value={headersText}
          onChange={(e) => setHeadersText(e.target.value)}
          placeholder='{ "X-Org": "abc" }'
        />
      </Field>

      {config.type === "custom-http" && (
        <>
          <Field label="请求模板 (JSON)">
            <textarea
              className={`${inputClass} h-28 font-mono text-xs`}
              value={requestText}
              onChange={(e) => setRequestText(e.target.value)}
              placeholder={
                '{\n  "method": "POST",\n  "headers": { "Authorization": "Bearer {{apiKey}}" },\n  "body": { "model": "{{model}}", "messages": "{{messages}}" }\n}'
              }
            />
          </Field>
          <Field label="响应映射 (JSON)">
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
          保存
        </button>
        <button className="btn btn-outline" onClick={handleTest} disabled={busy}>
          测试连接
        </button>
        {config.type !== "custom-http" && (
          <button
            className="btn btn-outline"
            onClick={handleListModels}
            disabled={busy}
          >
            获取模型列表
          </button>
        )}
      </div>

      {status && (
        <div
          className={`flex items-start gap-2 rounded-[var(--radius-sm)] border bg-[var(--color-canvas)] px-3 py-2 text-[11px] whitespace-pre-wrap ${
            statusOk === true
              ? "border-[color-mix(in_srgb,var(--color-success)_40%,transparent)] text-[var(--color-success)]"
              : statusOk === false
                ? "border-[color-mix(in_srgb,var(--color-error)_40%,transparent)] text-[var(--color-error)]"
                : "border-[var(--color-border)] text-[var(--color-text-secondary)]"
          }`}
        >
          {statusOk !== null && (
            <StatusDot tone={statusOk ? "ok" : "err"} className="mt-1" />
          )}
          <span className="min-w-0 font-mono">{status}</span>
        </div>
      )}
    </div>
  );
}
