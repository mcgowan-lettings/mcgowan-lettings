"use client";

import { useState } from "react";
import { renderInline, isHtml } from "@/lib/rich-text";
import { sanitizeHtml } from "@/lib/sanitize-html";

export default function ExpandableDescription({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);

  const html = isHtml(text);
  const plainLength = html ? text.replace(/<[^>]+>/g, " ").trim().length : text.length;
  const paragraphCount = html
    ? (text.match(/<p\b/gi) ?? []).length
    : text.split(/\n\s*\n/).filter((p) => p.trim()).length;
  const isLong = paragraphCount > 2 || plainLength > 500;

  const legacyParagraphs = html
    ? []
    : text
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean);

  return (
    <div>
      <div
        className={`relative ${!expanded && isLong ? "max-h-[150px] overflow-hidden" : ""}`}
      >
        {html ? (
          <div
            className="rich-content text-[15px]"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(text) }}
          />
        ) : (
          <div className="space-y-3">
            {legacyParagraphs.map((p, i) => (
              <p key={i} className="text-text-muted text-[15px] leading-relaxed">
                {renderInline(p)}
              </p>
            ))}
          </div>
        )}
        {isLong && !expanded && (
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent" />
        )}
      </div>
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2 text-sm font-semibold text-brand-dark hover:underline cursor-pointer"
        >
          {expanded ? "Show less" : "Read full description"}
        </button>
      )}
    </div>
  );
}
