import React from "react";

const INLINE_RE = /\*\*([^*\n]+?)\*\*|_([^_\n]+?)_(?![A-Za-z0-9_])|\[([^\]\n]+?)\]\(([^)\s]+)\)/g;

export function isHtml(content: string): boolean {
  return /<\/?(p|strong|em|b|i|a|h[1-6]|br|ul|ol|li)\b/i.test(content);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function isSafeUrl(url: string): boolean {
  return /^(https?:|mailto:|tel:|\/|#)/i.test(url.trim());
}

function inlineMarkdownToHtml(text: string): string {
  let result = "";
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  INLINE_RE.lastIndex = 0;
  while ((match = INLINE_RE.exec(text)) !== null) {
    if (match.index > lastIndex) {
      result += escapeHtml(text.slice(lastIndex, match.index));
    }
    if (match[1] !== undefined) {
      result += `<strong>${escapeHtml(match[1])}</strong>`;
    } else if (match[2] !== undefined) {
      // Only treat _x_ as italics at a word start — snake_case and URLs keep
      // their underscores. (No regex lookbehind: Safari < 16.4 can't parse it.)
      const prev = match.index > 0 ? text[match.index - 1] : "";
      if (/[A-Za-z0-9_]/.test(prev)) {
        result += "_";
        INLINE_RE.lastIndex = match.index + 1;
        lastIndex = INLINE_RE.lastIndex;
        continue;
      }
      result += `<em>${escapeHtml(match[2])}</em>`;
    } else if (match[3] !== undefined && match[4] !== undefined) {
      if (isSafeUrl(match[4])) {
        result += `<a href="${escapeHtml(match[4])}" target="_blank" rel="noopener noreferrer">${escapeHtml(match[3])}</a>`;
      } else {
        result += escapeHtml(match[3]);
      }
    }
    lastIndex = INLINE_RE.lastIndex;
  }
  if (lastIndex < text.length) {
    result += escapeHtml(text.slice(lastIndex));
  }
  return result;
}

export function markdownToHtml(md: string): string {
  if (!md) return "";
  if (isHtml(md)) return md;

  return md
    .split(/\n\n+/)
    .map((para) => {
      const trimmed = para.trim();
      if (!trimmed) return "";
      if (trimmed.startsWith("## ")) {
        return `<h2>${inlineMarkdownToHtml(trimmed.slice(3))}</h2>`;
      }
      const lines = trimmed.split("\n").map((l) => inlineMarkdownToHtml(l.trim()));
      return `<p>${lines.join("<br>")}</p>`;
    })
    .filter(Boolean)
    .join("");
}

// Legacy markdown inline renderer — kept for any remaining plain-text fields
export function renderInline(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  let match: RegExpExecArray | null;

  INLINE_RE.lastIndex = 0;
  while ((match = INLINE_RE.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    if (match[1] !== undefined) {
      nodes.push(<strong key={key++} className="font-semibold text-dark">{match[1]}</strong>);
    } else if (match[2] !== undefined) {
      // Same word-start rule as inlineMarkdownToHtml: snake_case keeps its
      // underscores.
      const prev = match.index > 0 ? text[match.index - 1] : "";
      if (/[A-Za-z0-9_]/.test(prev)) {
        nodes.push("_");
        INLINE_RE.lastIndex = match.index + 1;
        lastIndex = INLINE_RE.lastIndex;
        continue;
      }
      nodes.push(<em key={key++}>{match[2]}</em>);
    } else if (match[3] !== undefined && match[4] !== undefined) {
      if (isSafeUrl(match[4])) {
        nodes.push(
          <a
            key={key++}
            href={match[4]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-dark underline hover:text-brand"
          >
            {match[3]}
          </a>
        );
      } else {
        nodes.push(match[3]);
      }
    }
    lastIndex = INLINE_RE.lastIndex;
  }
  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }
  return nodes;
}
