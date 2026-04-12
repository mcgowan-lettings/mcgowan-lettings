"use client";

import { sanitizeHtml } from "@/lib/rich-text";

export default function BlogRichContent({ html }: { html: string }) {
  return (
    <div
      className="rich-content text-[15px] md:text-base"
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
    />
  );
}
