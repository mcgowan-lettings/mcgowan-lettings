"use client";

import { useState } from "react";
import { renderInline } from "@/lib/rich-text";

export default function ExpandableDescription({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);

  // Split into paragraphs, filter empty lines, render as proper <p> tags
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const isLong = paragraphs.length > 2 || text.length > 500;

  return (
    <div>
      <div
        className={`relative ${!expanded && isLong ? "max-h-[150px] overflow-hidden" : ""}`}
      >
        <div className="space-y-3">
          {paragraphs.map((p, i) => (
            <p key={i} className="text-text-muted text-[15px] leading-relaxed">
              {renderInline(p)}
            </p>
          ))}
        </div>
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
