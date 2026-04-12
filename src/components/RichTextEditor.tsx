"use client";

import { useRef } from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
  includeHeading?: boolean;
};

export default function RichTextEditor({
  value,
  onChange,
  rows = 6,
  placeholder,
  includeHeading = false,
}: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const applyChange = (next: string, caretStart: number, caretEnd: number) => {
    onChange(next);
    requestAnimationFrame(() => {
      const ta = ref.current;
      if (!ta) return;
      ta.focus();
      ta.setSelectionRange(caretStart, caretEnd);
    });
  };

  const wrap = (marker: string) => {
    const ta = ref.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = value.slice(start, end);
    if (!selected) {
      // No selection — insert markers and place caret between them
      const next = value.slice(0, start) + marker + marker + value.slice(end);
      const pos = start + marker.length;
      applyChange(next, pos, pos);
      return;
    }
    const next =
      value.slice(0, start) + marker + selected + marker + value.slice(end);
    applyChange(next, start + marker.length, start + marker.length + selected.length);
  };

  const insertLinePrefix = (prefix: string) => {
    const ta = ref.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const before = value.slice(0, start);
    const lineStart = before.lastIndexOf("\n") + 1;
    if (value.slice(lineStart).startsWith(prefix)) return;
    const next = value.slice(0, lineStart) + prefix + value.slice(lineStart);
    const pos = start + prefix.length;
    applyChange(next, pos, pos);
  };

  const handleBold = () => wrap("**");
  const handleItalic = () => wrap("_");
  const handleHeading = () => insertLinePrefix("## ");
  const handleLink = () => {
    const ta = ref.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = value.slice(start, end);
    const url = window.prompt("Enter URL (e.g. https://example.com):", "https://");
    if (!url) return;
    const linkText = selected || "link text";
    const replacement = `[${linkText}](${url})`;
    const next = value.slice(0, start) + replacement + value.slice(end);
    applyChange(next, start + 1, start + 1 + linkText.length);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!(e.metaKey || e.ctrlKey) || e.shiftKey || e.altKey) return;
    if (e.key === "b" || e.key === "B") {
      e.preventDefault();
      handleBold();
    } else if (e.key === "i" || e.key === "I") {
      e.preventDefault();
      handleItalic();
    } else if (e.key === "k" || e.key === "K") {
      e.preventDefault();
      handleLink();
    }
  };

  const btn =
    "flex h-8 min-w-[2rem] items-center justify-center rounded-md px-2 text-dark transition-colors hover:bg-gray-200 active:bg-gray-300";

  return (
    <div>
      <div className="flex items-center gap-0.5 rounded-t-lg border border-b-0 border-gray-300 bg-gray-50 px-1.5 py-1">
        {includeHeading && (
          <button type="button" onClick={handleHeading} className={btn} title="Heading — adds to start of line" aria-label="Heading">
            <span className="text-sm font-semibold">H</span>
          </button>
        )}
        <button type="button" onClick={handleBold} className={btn} title="Bold (Cmd/Ctrl+B)" aria-label="Bold">
          <span className="text-sm font-bold">B</span>
        </button>
        <button type="button" onClick={handleItalic} className={btn} title="Italic (Cmd/Ctrl+I)" aria-label="Italic">
          <span className="font-serif text-base italic font-semibold">I</span>
        </button>
        <button type="button" onClick={handleLink} className={btn} title="Link (Cmd/Ctrl+K)" aria-label="Link">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
          </svg>
        </button>
        <span className="ml-auto hidden pr-1 text-[11px] text-text-muted sm:inline">
          Select text, then click a button
        </span>
      </div>
      <textarea
        ref={ref}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full resize-none rounded-b-lg border border-gray-300 px-4 py-2.5 text-sm text-dark outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand"
      />
    </div>
  );
}
