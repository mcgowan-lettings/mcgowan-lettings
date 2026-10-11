import sanitize from "sanitize-html";

// Use `sanitize-html` (htmlparser2-based) instead of isomorphic-dompurify.
// isomorphic-dompurify pulls in jsdom, which crashes on Vercel's Node serverless
// runtime at module load — and the SSR pass for our "use client" rich-text
// components runs on that same Lambda, so any imported route 500s before our
// code executes. sanitize-html has no DOM dependency and works in any JS env.
//
// The allow-list must match what RichTextEditor's TipTap schema can produce
// (and re-load): p, br, strong/b, em/i, u, a, h2, h3, ul, ol (+start), li.
export function sanitizeHtml(html: string): string {
  return sanitize(html, {
    allowedTags: ["p", "br", "strong", "em", "b", "i", "u", "a", "h2", "h3", "ul", "ol", "li"],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      // TipTap writes start="N" on a numbered list that doesn't begin at 1.
      ol: ["start"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
  });
}
