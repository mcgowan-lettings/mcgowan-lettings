// Shared property-search helpers used by the /properties filter bar and the
// home-page hero search, so both map stored types and areas identically.

import { BOROUGH_LIST, type County } from "@/app/areas/areas-data";

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

// `properties.area` is hand-typed and usually a neighbourhood ("Ramsbottom",
// "Edenfield", "Holcombe Brook"), while search and the area guides work in
// boroughs ("Bury", "Rochdale", …). resolveArea() maps every listing onto one
// display area so "Bury" finds every Bury-borough home:
//   1. `area` is itself a borough name → that borough;
//   2. `area` is a neighbourhood from the area-guide lists (BOROUGHS) or the
//      extra map below → its borough;
//   3. otherwise scan `location` ("…, Bamford, Rochdale, OL11 5HH") from the
//      right for a borough / known neighbourhood segment (rightmost wins, so
//      "107 Burnley Road, Edenfield, Bury" is Bury, not Burnley);
//   4. otherwise keep the area as typed (its own option in the dropdown).

/** The seven area-guide boroughs, in display order (Bury = main area). */
export const KNOWN_AREAS: string[] = BOROUGH_LIST.map((b) => b.name);

// Places outside the seven boroughs that we still group under their town.
const OUTER_TOWN_COUNTY: Record<string, County> = {
  blackburn: "Lancashire",
  chorley: "Lancashire",
};

// Neighbourhoods that appear in listings but aren't in the guide lists.
// Values are a borough name or an outer town above.
const EXTRA_NEIGHBOURHOODS: Record<string, string> = {
  // Bury borough
  bury: "Bury",
  edenfield: "Bury", // Rossendale borough, but BL0 / Bury postal town
  "holcombe brook": "Bury",
  holcombe: "Bury",
  elton: "Bury",
  brandlesholme: "Bury",
  ainsworth: "Bury",
  summerseat: "Bury",
  walshaw: "Bury",
  unsworth: "Bury",
  // Rochdale borough
  bamford: "Rochdale",
  // Rossendale
  helmshore: "Rossendale",
  // Outer towns
  pleckgate: "Blackburn",
  "buckshaw village": "Chorley",
};

const RESOLVE: Map<string, string> = (() => {
  const m = new Map<string, string>();
  for (const [k, v] of Object.entries(EXTRA_NEIGHBOURHOODS)) m.set(k, v);
  for (const b of BOROUGH_LIST) {
    for (const n of b.neighbourhoods) m.set(n.toLowerCase(), b.name);
    m.set(b.name.toLowerCase(), b.name);
  }
  for (const town of Object.keys(OUTER_TOWN_COUNTY)) {
    m.set(town, town.charAt(0).toUpperCase() + town.slice(1));
  }
  return m;
})();

export function normaliseArea(area: string | null | undefined): string {
  return (area ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

type Locatable = { area?: string | null; location?: string | null };

/** Display area (borough, outer town, or the area as typed) for a listing. */
export function resolveArea(p: Locatable): string {
  const area = normaliseArea(p.area);
  const direct = area ? RESOLVE.get(area) : undefined;
  if (direct) return direct;
  const segments = (p.location ?? "").split(",").map(normaliseArea).filter(Boolean);
  for (let i = segments.length - 1; i >= 0; i--) {
    const hit = RESOLVE.get(segments[i]);
    if (hit) return hit;
  }
  return (p.area ?? "").trim().replace(/\s+/g, " ");
}

/** County for a listing (schema.org addressRegion), or null if unknown. */
export function resolveCounty(p: Locatable): County | null {
  const key = normaliseArea(resolveArea(p));
  const borough = BOROUGH_LIST.find((b) => b.name.toLowerCase() === key);
  if (borough) return borough.county;
  return Object.hasOwn(OUTER_TOWN_COUNTY, key) ? OUTER_TOWN_COUNTY[key] : null;
}

/** Does a listing match an `?area=` value? A borough matches all its
 *  neighbourhoods; any other value (old links like ?area=Ramsbottom) still
 *  matches the stored area exactly. */
export function matchesArea(p: Locatable, value: string | null | undefined): boolean {
  const key = normaliseArea(value);
  if (!key || key === "all areas") return true;
  return normaliseArea(p.area) === key || normaliseArea(resolveArea(p)) === key;
}

/** Distinct, display-ordered areas for the search dropdowns: boroughs with
 *  listings first (curated order), then any other resolved areas A–Z. */
export function buildAreaList(listings: Locatable[]): string[] {
  const byKey = new Map<string, string>();
  for (const p of listings) {
    const resolved = resolveArea(p);
    if (resolved && !byKey.has(resolved.toLowerCase())) byKey.set(resolved.toLowerCase(), resolved);
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

/* ───────────────────────── STATUS / ORDER ───────────────────────── */

// Admin STATUSES are "To Let" and "Let Agreed"; null/empty is treated as
// "To Let" everywhere on the public site.
export function isAvailable(status: string | null | undefined): boolean {
  return (status ?? "").trim().toLowerCase() !== "let agreed";
}

/** Available listings first, then price high → low. Returns a new array. */
export function sortByAvailability<T extends { status?: string | null; price?: number | null }>(
  list: readonly T[]
): T[] {
  return [...list].sort((a, b) => {
    const av = isAvailable(a.status) ? 0 : 1;
    const bv = isAvailable(b.status) ? 0 : 1;
    if (av !== bv) return av - bv;
    return (b.price ?? 0) - (a.price ?? 0);
  });
}

/* ───────────────────────── CARD TEXT ───────────────────────── */

/** Title and location are often identical; avoid printing it twice. */
export function locationDiffersFromTitle(title: string | null | undefined, location: string | null | undefined): boolean {
  const l = normaliseArea(location);
  return !!l && l !== normaliseArea(title);
}

export function cardAlt(title: string, location: string | null | undefined): string {
  return locationDiffersFromTitle(title, location) ? `${title} in ${location}` : title;
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
