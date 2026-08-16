import { useMemo, useState, type ReactNode } from "react";
import { normalizePreviewUrl } from "@/features/communication/conversations_redesign/utils/linkPreview";

const MAX_COLLAPSED_CHARACTERS = 700;
const MAX_COLLAPSED_LINES = 8;
const URL_PATTERN = /(?:https?:\/\/|www\.)[^\s<>()]+/;

function isCollapsible(text: string) {
  return (
    text.length > MAX_COLLAPSED_CHARACTERS ||
    text.split(/\r?\n/).length > MAX_COLLAPSED_LINES
  );
}

function collapsedText(text: string) {
  const lines = text.split(/\r?\n/);
  if (lines.length > MAX_COLLAPSED_LINES) {
    return `${lines.slice(0, MAX_COLLAPSED_LINES).join("\n").trimEnd()}...`;
  }

  return `${text.slice(0, MAX_COLLAPSED_CHARACTERS).trimEnd()}...`;
}

type InlineMatch = {
  index: number;
  length: number;
  content: string;
  type: "bold" | "italic" | "strike" | "code" | "url";
};

function findNextMatch(text: string): InlineMatch | null {
  const patterns: Array<{
    regex: RegExp;
    type: InlineMatch["type"];
    contentGroup: number;
  }> = [
    { regex: /```([^`]+?)```/, type: "code", contentGroup: 1 },
    { regex: /\*([^*\s](?:[^*]*[^*\s])?)\*/, type: "bold", contentGroup: 1 },
    { regex: /_([^_\s](?:[^_]*[^_\s])?)_/, type: "italic", contentGroup: 1 },
    { regex: /~([^~\s](?:[^~]*[^~\s])?)~/, type: "strike", contentGroup: 1 },
    { regex: URL_PATTERN, type: "url", contentGroup: 0 },
  ];

  return patterns.reduce<InlineMatch | null>((earliest, pattern) => {
    const match = pattern.regex.exec(text);
    if (!match || match.index < 0) return earliest;

    if (earliest && earliest.index <= match.index) return earliest;

    return {
      index: match.index,
      length: match[0].length,
      content: match[pattern.contentGroup] ?? match[0],
      type: pattern.type,
    };
  }, null);
}

function renderToken(match: InlineMatch, key: string) {
  if (match.type === "bold") {
    return <strong key={key}>{match.content}</strong>;
  }

  if (match.type === "italic") {
    return <em key={key}>{match.content}</em>;
  }

  if (match.type === "strike") {
    return <s key={key}>{match.content}</s>;
  }

  if (match.type === "code") {
    return (
      <code
        key={key}
        className="rounded bg-black/10 px-1 py-0.5 font-mono text-[0.92em]"
      >
        {match.content}
      </code>
    );
  }

  return (
    <a
      key={key}
      href={normalizePreviewUrl(match.content)}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium underline underline-offset-2 hover:opacity-80"
    >
      {match.content}
    </a>
  );
}

function renderInlineText(text: string) {
  const nodes: ReactNode[] = [];
  let remaining = text;
  let offset = 0;

  while (remaining.length > 0) {
    const match = findNextMatch(remaining);

    if (!match) {
      nodes.push(remaining);
      break;
    }

    if (match.index > 0) {
      nodes.push(remaining.slice(0, match.index));
    }

    nodes.push(renderToken(match, `token-${offset + match.index}`));
    const consumed = match.index + match.length;
    offset += consumed;
    remaining = remaining.slice(consumed);
  }

  return nodes;
}

export function MessageText({
  isOwn,
  readMoreLabel,
  showLessLabel,
  text,
}: {
  isOwn: boolean;
  readMoreLabel: string;
  showLessLabel: string;
  text: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldCollapse = isCollapsible(text);
  const visibleText = shouldCollapse && !isExpanded ? collapsedText(text) : text;
  const renderedText = useMemo(() => renderInlineText(visibleText), [visibleText]);

  return (
    <div className="min-w-0">
      <p
        dir="auto"
        className="whitespace-pre-wrap break-words text-sm leading-6 [overflow-wrap:anywhere]"
      >
        {renderedText}
      </p>
      {shouldCollapse ? (
        <button
          type="button"
          className={`mt-1 text-xs font-semibold underline-offset-2 hover:underline ${
            isOwn ? "text-white/85" : "text-primary"
          }`}
          onClick={() => setIsExpanded((current) => !current)}
        >
          {isExpanded ? showLessLabel : readMoreLabel}
        </button>
      ) : null}
    </div>
  );
}
