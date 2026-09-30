import type { ReactNode } from "react";

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
          className="rounded bg-black/40 px-1 py-0.5 font-mono text-[0.86em] text-[#c8b6ff]"
        >
          {token.slice(1, -1)}
        </code>,
      );
    } else if (token.startsWith("**")) {
      nodes.push(
        <strong key={key} className="font-semibold text-[var(--color-fg)]">
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
            className="text-[var(--color-iris-hi)] underline decoration-dotted underline-offset-2"
          >
            {linkMatch[1]}
          </a>,
        );
      } else {
        nodes.push(token);
      }
    } else {
      nodes.push(
        <em key={key} className="italic text-[var(--color-dim)]">
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
  return (
    <div className="my-1.5 overflow-hidden rounded-lg border border-[var(--color-line)] bg-[#08090d]">
      {lang && (
        <div className="flex items-center justify-between border-b border-[var(--color-line-soft)] px-2.5 py-1">
          <span className="font-mono text-[10px] tracking-wide text-[var(--color-mute)] uppercase">
            {lang}
          </span>
        </div>
      )}
      <pre className="overflow-x-auto p-2.5 font-mono text-[11.5px] leading-relaxed text-[#d7dbe8]">
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
          className={`my-1 space-y-0.5 pl-4 ${ordered ? "list-decimal" : "list-disc"} marker:text-[var(--color-mute)]`}
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
            className={`mt-2 mb-0.5 font-semibold text-[var(--color-fg)] ${
              level <= 2 ? "text-[14px]" : "text-[13px]"
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
            className="my-1 border-l-2 border-[var(--color-line)] pl-2.5 text-[var(--color-dim)]"
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
