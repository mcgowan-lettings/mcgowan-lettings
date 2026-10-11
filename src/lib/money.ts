// Display helpers for money typed free-text by applicants (rent, income).
// The stored values are whatever people typed — "950", "£950", "£1,250 pcm",
// "950 per month" — so naively wrapping them as `£${x} pcm` produced
// "££950 pcm" / "£950 pcm pcm". These normalise for display only; the stored
// value is never changed.

const PERIOD_RE =
  /per\s+calendar\s+month|per\s+month|a\s+month|p\.?\s*c\.?\s*m\.?|\/\s*(?:month|mth|mo|m)\b|\bpm\b|\bmonthly\b/gi;

const GBP_WHOLE = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});
const GBP_PENCE = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });
const gbp = (n: number) => (Number.isInteger(n) ? GBP_WHOLE : GBP_PENCE).format(n);

/**
 * Parse a typed amount to a number, ignoring £/GBP, commas, whitespace and a
 * "pcm"/"per month" suffix. Returns null if anything else is left over
 * (e.g. "950 negotiable", "around 900").
 */
export function parseMoneyAmount(raw: string | number | null | undefined): number | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
  const cleaned = raw
    .replace(PERIOD_RE, "")
    .replace(/£|gbp/gi, "")
    .replace(/[,\s]/g, "");
  if (!/^\d+(?:\.\d{1,2})?$/.test(cleaned)) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

/** "950" / "£950" / "£950 pcm" → "£950"; unparseable text is returned trimmed as-is. */
export function formatMoneyDisplay(raw: string | number | null | undefined): string {
  if (raw === null || raw === undefined) return "";
  const n = parseMoneyAmount(raw);
  if (n === null) return String(raw).trim();
  return gbp(n);
}

/**
 * "950" / "£950" / "£950 pcm" / "950 per month" → "£950 pcm".
 * Text that isn't a plain amount (e.g. "£950 negotiable") is returned trimmed
 * as-is rather than guessed at, so nothing is ever doubled up or lost.
 */
export function formatRentDisplay(raw: string | number | null | undefined): string {
  if (raw === null || raw === undefined) return "";
  const n = parseMoneyAmount(raw);
  if (n === null) return String(raw).trim();
  return `${gbp(n)} pcm`;
}
