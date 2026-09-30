import { useState } from "react";
import { ModelGateway } from "../../models/ModelGateway";
import { useModelStore } from "../../store/modelStore";
import {
  DEFAULT_CAPABILITIES,
  type ModelProviderConfig,
  type ProviderCapabilities,
  type ProviderType,
} from "../../types/model";
import {
  IconCheck,
  IconChevronRight,
  IconCopy,
  IconEye,
  IconEyeOff,
} from "../ui/icons";
import { StatusDot } from "../ui/Status";

const TYPE_OPTIONS: { value: ProviderType; label: string }[] = [
  { value: "openai-compatible", label: "OpenAI 兼容" },
  { value: "custom-http", label: "自定义 HTTP" },
  { value: "ollama", label: "Ollama" },
  { value: "anthropic", label: "Anthropic" },
];

function completionPreview(config: ModelProviderConfig): string {
  const base = config.baseUrl.replace(/\/+$/, "");
  switch (config.type) {
    case "openai-compatible":
      return `${base}/chat/completions`;
    case "anthropic":
      return `${base}/v1/messages`;
    case "ollama":
      return `${base}/api/chat`;
    case "custom-http":
      return base;
  }
}

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
      setStatusOk(null);
      setStatus("正在检查连接…");
      const result = await ModelGateway.testConnection(next);
      if (!result.ok) {
        setStatusOk(false);
        setStatus(`连接失败 (${result.latencyMs}ms) — ${result.message}`);
        return;
      }
      await upsertProvider(next);
      setStatusOk(true);
      setStatus(`已保存，连接正常 (${result.latencyMs}ms)`);
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
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto p-4 md:p-5">
        <Field label="接口格式">
          <div className="flex gap-1 rounded-[var(--radius-panel)] bg-[var(--color-canvas)] p-1">
            {TYPE_OPTIONS.map((option) => {
              const active = config.type === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  className={`flex-1 truncate rounded-[var(--radius-btn)] px-2 py-1.5 text-xs font-medium transition-colors ${
                    active
                      ? "bg-[var(--color-surface-raised)] text-[var(--color-text)] shadow-sm"
                      : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                  }`}
                  onClick={() => patch({ type: option.value })}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </Field>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="名称">
            <input
              className={inputClass}
              value={config.name}
              onChange={(e) => patch({ name: e.target.value })}
            />
          </Field>
        </div>

        <div className="mt-4 space-y-1.5">
          <span className="field-label">
            {config.type === "custom-http" ? "接口地址" : "Base URL"}
          </span>
          <input
            className={inputClass}
            value={config.baseUrl}
            onChange={(e) => patch({ baseUrl: e.target.value })}
            placeholder="https://api.example.com/v1"
          />
          {config.baseUrl.trim() && (
            <p className="font-mono text-[11px] leading-relaxed break-all text-[var(--color-text-disabled)]">
              实际请求 {completionPreview(config)}
            </p>
          )}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="模型名称">
            <div className="flex gap-2">
              <input
                className={`${inputClass} min-w-0 flex-1`}
                list="acs-model-list"
                value={config.model}
                onChange={(e) => patch({ model: e.target.value })}
                placeholder="如 deepseek-chat"
              />
              {config.type !== "custom-http" && (
                <button
                  type="button"
                  className="btn btn-outline shrink-0 !px-2.5 !text-xs"
                  onClick={handleListModels}
                  disabled={busy || !config.apiKey}
                  title={
                    config.apiKey ? "拉取可用模型列表" : "先填写 API Key"
                  }
                >
                  拉取列表
                </button>
              )}
            </div>
            <datalist id="acs-model-list">
              {models.map((model) => (
                <option key={model} value={model} />
              ))}
            </datalist>
            <p className="text-[11px] leading-relaxed text-[var(--color-text-muted)]">
              输入 API Token 后可拉取可用模型列表选择；拉取失败时按服务商文档手动填写。
            </p>
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

        <div className="mt-4">
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
        </div>

        <details className="group mt-4">
          <summary className="flex cursor-pointer list-none items-center gap-1 text-sm font-medium text-[var(--color-text-secondary)]">
            高级配置
            <IconChevronRight
              size={14}
              className="transition-transform group-open:rotate-90"
            />
          </summary>
          <div className="mt-3 space-y-3">
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
          </div>
        </details>

        {status && (
          <div
            className={`mt-4 flex items-start gap-2 rounded-[var(--radius-sm)] border bg-[var(--color-canvas)] px-3 py-2 text-[11px] whitespace-pre-wrap ${
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

      <div className="flex shrink-0 items-center gap-2 border-t border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-3 md:p-4">
        <button
          className="btn btn-primary flex-1 md:flex-none"
          onClick={handleSave}
          disabled={busy}
        >
          {busy ? "检查中…" : "检查并保存"}
        </button>
        <button className="btn btn-outline" onClick={handleTest} disabled={busy}>
          仅测试连接
        </button>
      </div>
    </div>
  );
}
