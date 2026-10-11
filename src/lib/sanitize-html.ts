import sanitize from "sanitize-html";

// Use `sanitize-html` (htmlparser2-based) instead of isomorphic-dompurify.
// isomorphic-dompurify pulls in jsdom, which crashes on Vercel's Node serverless
// runtime at module load — and the SSR pass for our "use client" rich-text
// components runs on that same Lambda, so any imported route 500s before our
// code executes. sanitize-html has no DOM dependency and works in any JS env.
export function sanitizeHtml(html: string): string {
  return sanitize(html, {
    allowedTags: ["p", "br", "strong", "em", "b", "i", "u", "a", "h2", "h3", "ul", "ol", "li"],
    allowedAttributes: {
      a: ["href", "target", "rel"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
  });
}
