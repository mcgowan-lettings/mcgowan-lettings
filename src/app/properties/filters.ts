// Shared property-search helpers used by the /properties filter bar and the
// home-page hero search, so both map stored types and areas identically.

/* ───────────────────────── PROPERTY TYPE ───────────────────────── */

// Stored `properties.type` values are specific ("Semi Detached", "Detached
// Bungalow", "Studio Apartment", "Town House", …) — see TYPES in the admin
// property form. The public filter offers broad categories instead, so map
// every stored type onto one of these.
export type TypeCategory = "House" | "Apartment" | "Bungalow";

export const TYPE_FILTER_OPTIONS: { value: TypeCategory; label: string }[] = [
  { value: "House", label: "House" },
  { value: "Apartment", label: "Apartment / Flat" },
  { value: "Bungalow", label: "Bungalow" },
];

const APARTMENT_RE = /apartment|flat|penthouse|studio|maisonette|duplex/i;

/** Bungalow if the type says so; apartment-like keywords → Apartment; every
 *  other type (Terraced, Semi Detached, Town House, Quasi Semi, Barn
 *  Conversion, Cottage, House Share, or anything new/unknown) → House. */
export function propertyTypeCategory(type: string | null | undefined): TypeCategory {
  const t = (type ?? "").trim();
  if (/bungalow/i.test(t)) return "Bungalow";
  if (APARTMENT_RE.test(t)) return "Apartment";
  return "House";
}

/** Normalise a `?type=` URL value to a category (accepts legacy "Flat" and
 *  any casing). Returns null for "All Types"/empty/unrecognised. */
export function parseTypeFilter(value: string | null | undefined): TypeCategory | null {
  const v = (value ?? "").trim().toLowerCase();
  if (!v || v === "all types") return null;
  if (v === "house") return "House";
  if (v === "bungalow") return "Bungalow";
  if (v === "apartment" || v === "flat" || v === "apartment / flat") return "Apartment";
  return null;
}

/* ───────────────────────── AREA ───────────────────────── */

// Curated order — known areas appear first; any extra areas (e.g. typed in by
// admin) are appended alphabetically.
const KNOWN_AREAS = ["Bury", "Bolton", "Manchester", "Rochdale", "Rossendale", "Accrington", "Burnley"];

export function normaliseArea(area: string | null | undefined): string {
  return (area ?? "").trim().toLowerCase();
}

/** Distinct, display-ordered areas from live property data (deduped
 *  case-insensitively and trimmed). */
export function buildAreaList(areas: (string | null | undefined)[]): string[] {
  const byKey = new Map<string, string>();
  for (const a of areas) {
    const trimmed = (a ?? "").trim();
    if (trimmed && !byKey.has(trimmed.toLowerCase())) byKey.set(trimmed.toLowerCase(), trimmed);
  }
  const ordered: string[] = [];
  for (const known of KNOWN_AREAS) {
    const key = known.toLowerCase();
    const hit = byKey.get(key);
    if (hit) {
      ordered.push(hit);
      byKey.delete(key);
    }
  }
  const extras = Array.from(byKey.values()).sort((a, b) => a.localeCompare(b));
  return [...ordered, ...extras];
}

/* ───────────────────────── PRICE / BEDS ───────────────────────── */

export const MAX_PRICE_VALUES = ["£500", "£750", "£1,000", "£1,250", "£1,500", "£2,000+"] as const;

/** Every value is an upper limit except "£2,000+", which means no cap. */
export function matchesPrice(price: number, value: string): boolean {
  if (!value || value === "Any Price") return true;
  const n = parseInt(value.replace(/[£,+\s]/g, ""), 10);
  if (Number.isNaN(n)) return true;
  // "£2,000+" is the top of a *max* price list: no upper cap.
  if (value.trim().endsWith("+")) return true;
  return price <= n;
}

export const BEDROOM_VALUES = ["Studio", "1", "2", "3", "4+"] as const;

export function matchesBeds(beds: number, value: string): boolean {
  if (!value || value === "Any Beds") return true;
  const v = value.trim();
  if (v.toLowerCase() === "studio") return beds === 0;
  const n = parseInt(v, 10);
  if (Number.isNaN(n)) return true;
  if (v.endsWith("+")) return beds >= n;
  return beds === n;
}

export function formatPrice(price: number | null | undefined): string {
  return (price ?? 0).toLocaleString("en-GB");
}
