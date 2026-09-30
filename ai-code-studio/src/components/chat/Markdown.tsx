import { useState, type ReactNode } from "react";
import { IconCheck, IconCopy } from "../ui/icons";

/** Inline formatting: `code`, **bold**, *italic*, [text](url). */
function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern =
    /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*]+\*)|(\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let index = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const token = match[0];
    const key = `${keyPrefix}-${index++}`;
    if (token.startsWith("`")) {
      nodes.push(
        <code
          key={key}
          className="rounded-[4px] bg-[var(--color-surface-raised)] px-1 py-0.5 font-mono text-[0.86em] text-[var(--color-accent-text)]"
        >
          {token.slice(1, -1)}
        </code>,
      );
    } else if (token.startsWith("**")) {
      nodes.push(
        <strong key={key} className="font-semibold text-[var(--color-text)]">
          {token.slice(2, -2)}
        </strong>,
      );
    } else if (token.startsWith("[")) {
      const linkMatch = token.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        nodes.push(
          <a
            key={key}
            href={linkMatch[2]}
            target="_blank"
            rel="noreferrer"
            className="text-[var(--color-accent-text)] underline decoration-dotted underline-offset-2"
          >
            {linkMatch[1]}
          </a>,
        );
      } else {
        nodes.push(token);
      }
    } else {
      nodes.push(
        <em key={key} className="italic text-[var(--color-text-secondary)]">
          {token.slice(1, -1)}
        </em>,
      );
    }
    last = match.index + token.length;
  }

  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable; ignore
    }
  };

  return (
    <div className="my-2 overflow-hidden rounded-[var(--radius-panel)] border border-[var(--color-border-subtle)] bg-[var(--color-canvas)]">
      <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] px-2.5 py-1">
        <span className="font-mono text-[10px] tracking-wide text-[var(--color-text-muted)]">
          {lang || "text"}
        </span>
        <button
          className="flex items-center gap-1 rounded-[var(--radius-xs)] px-1.5 py-0.5 text-[10px] text-[var(--color-text-muted)] transition-colors hover:bg-white/[0.06] hover:text-[var(--color-text)]"
          onClick={copy}
          title="复制代码"
          aria-label="复制代码"
        >
          {copied ? (
            <>
              <IconCheck size={11} className="text-[var(--color-success)]" />
              已复制
            </>
          ) : (
            <>
              <IconCopy size={11} />
              复制
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto p-2.5 font-mono text-[11.5px] leading-relaxed text-[var(--color-text)]">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function renderBlocks(text: string): ReactNode[] {
  const blocks: ReactNode[] = [];
  const parts = text.split(/```/);
  parts.forEach((part, partIndex) => {
    if (partIndex % 2 === 1) {
      const newline = part.indexOf("\n");
      const lang = newline >= 0 ? part.slice(0, newline).trim() : "";
      const code = newline >= 0 ? part.slice(newline + 1) : part;
      blocks.push(
        <CodeBlock key={`code-${partIndex}`} code={code.replace(/\n$/, "")} lang={lang} />,
      );
      return;
    }

    const lines = part.split("\n");
    let list: string[] = [];
    let ordered = false;

    const flushList = (key: string) => {
      if (list.length === 0) return;
      const Tag = ordered ? "ol" : "ul";
      blocks.push(
        <Tag
          key={key}
          className={`my-1 space-y-0.5 pl-4 ${ordered ? "list-decimal" : "list-disc"} marker:text-[var(--color-text-muted)]`}
        >
          {list.map((item, i) => (
            <li key={i}>{renderInline(item, `${key}-${i}`)}</li>
          ))}
        </Tag>,
      );
      list = [];
    };

    lines.forEach((line, lineIndex) => {
      const bullet = line.match(/^\s*[-*]\s+(.*)$/);
      const numbered = line.match(/^\s*\d+\.\s+(.*)$/);
      if (bullet) {
        if (ordered) flushList(`list-${partIndex}-${lineIndex}`);
        ordered = false;
        list.push(bullet[1]);
        return;
      }
      if (numbered) {
        if (!ordered) flushList(`list-${partIndex}-${lineIndex}`);
        ordered = true;
        list.push(numbered[1]);
        return;
      }
      flushList(`list-${partIndex}-${lineIndex}`);

      const heading = line.match(/^(#{1,4})\s+(.*)$/);
      if (heading) {
        const level = heading[1].length;
        blocks.push(
          <div
            key={`h-${partIndex}-${lineIndex}`}
            className={`mt-2.5 mb-1 font-semibold text-[var(--color-text)] ${
              level <= 2 ? "text-md" : "text-base"
            }`}
          >
            {renderInline(heading[2], `h-${partIndex}-${lineIndex}`)}
          </div>,
        );
        return;
      }

      const quote = line.match(/^>\s?(.*)$/);
      if (quote) {
        blocks.push(
          <blockquote
            key={`q-${partIndex}-${lineIndex}`}
            className="my-1 border-l-2 border-[var(--color-border-strong)] pl-2.5 text-[var(--color-text-secondary)]"
          >
            {renderInline(quote[1], `q-${partIndex}-${lineIndex}`)}
          </blockquote>,
        );
        return;
      }

      if (line.trim() === "") {
        blocks.push(<div key={`sp-${partIndex}-${lineIndex}`} className="h-1.5" />);
        return;
      }

      blocks.push(
        <p key={`p-${partIndex}-${lineIndex}`} className="my-0.5">
          {renderInline(line, `p-${partIndex}-${lineIndex}`)}
        </p>,
      );
    });

    flushList(`list-${partIndex}-end`);
  });

  return blocks;
}

/** Minimal markdown renderer covering the subset the agent actually emits. */
export default function Markdown({ content }: { content: string }) {
  return <div className="text-[13px] leading-[1.6]">{renderBlocks(content)}</div>;
}
