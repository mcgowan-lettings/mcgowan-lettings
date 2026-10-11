/** URL-safe slug: lowercase ASCII, hyphen-separated. Accents are folded
 * ("Café" → "cafe") rather than dropped. Shared by the blog editors and
 * re-applied server-side so a hand-typed slug can't produce a fragile URL. */
export function generateSlug(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
