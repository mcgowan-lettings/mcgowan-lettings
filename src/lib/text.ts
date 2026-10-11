/**
 * Plain-text helpers for meta descriptions / JSON-LD built from stored HTML.
 * (Mirrors the private helpers in `properties/[id]/page.tsx`.)
 */

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  pound: "£",
  ndash: "–",
  mdash: "—",
  hellip: "…",
  rsquo: "’",
  lsquo: "‘",
  rdquo: "”",
  ldquo: "“",
};

export function decodeEntities(text: string): string {
  // Loop so double-encoded text ("&amp;amp;") decodes fully.
  let prev: string;
  let out = text;
  let guard = 0;
  do {
    prev = out;
    out = out.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, code: string) => {
      if (code[0] === "#") {
        const n =
          code[1] === "x" || code[1] === "X" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
        return Number.isFinite(n) && n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : m;
      }
      const named = NAMED_ENTITIES[code.toLowerCase()];
      return named ?? m;
    });
  } while (out !== prev && ++guard < 3);
  return out;
}

/** Strip tags (as spaces, so "</p><p>" doesn't glue words), decode entities,
 *  collapse whitespace and drop the stray space left before punctuation. */
export function plainText(html: string | null | undefined): string {
  return decodeEntities((html ?? "").replace(/<[^>]+>/g, " "))
    .replace(/[\s ]+/g, " ")
    .replace(/ +([,.;:!?])/g, "$1")
    .trim();
}

/** Trim to `max` chars on a word boundary, adding "…" when cut. */
export function truncateWords(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  const base = lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut;
  return `${base.replace(/[\s,.;:!?\-–—]+$/, "")}…`;
}
