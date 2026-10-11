// Canonical list of the boroughs we publish area guides for, with their key
// neighbourhoods and county. Kept deliberately small (no guide copy) because
// it is also imported by client components via the property-search resolver
// in src/app/properties/filters.ts. The long-form guide content lives in
// src/app/areas/[slug]/page.tsx and references these lists.

export type County = "Greater Manchester" | "Lancashire";

export interface Borough {
  name: string;
  slug: string;
  county: County;
  neighbourhoods: string[];
}

export const BOROUGHS = {
  bury: {
    name: "Bury",
    slug: "bury",
    county: "Greater Manchester",
    neighbourhoods: ["Tottington", "Ramsbottom", "Whitefield", "Radcliffe", "Prestwich"],
  },
  bolton: {
    name: "Bolton",
    slug: "bolton",
    county: "Greater Manchester",
    neighbourhoods: ["Farnworth", "Harwood", "Horwich", "Westhoughton", "Lostock"],
  },
  manchester: {
    name: "Manchester",
    slug: "manchester",
    county: "Greater Manchester",
    neighbourhoods: ["Deansgate", "Ancoats", "Salford", "Eccles", "Chorlton"],
  },
  rochdale: {
    name: "Rochdale",
    slug: "rochdale",
    county: "Greater Manchester",
    neighbourhoods: ["Heywood", "Middleton", "Littleborough", "Milnrow", "Norden"],
  },
  rossendale: {
    name: "Rossendale",
    slug: "rossendale",
    county: "Lancashire",
    neighbourhoods: ["Rawtenstall", "Haslingden", "Bacup", "Waterfoot"],
  },
  accrington: {
    name: "Accrington",
    slug: "accrington",
    county: "Lancashire",
    neighbourhoods: ["Great Harwood", "Clayton-le-Moors", "Oswaldtwistle", "Rishton"],
  },
  burnley: {
    name: "Burnley",
    slug: "burnley",
    county: "Lancashire",
    neighbourhoods: ["Padiham", "Brierfield", "Nelson", "Colne"],
  },
} as const satisfies Record<string, Borough>;

export type BoroughSlug = keyof typeof BOROUGHS;

/** Display order: Bury (main area) first. */
export const BOROUGH_LIST: Borough[] = Object.values(BOROUGHS).map((b) => ({
  ...b,
  neighbourhoods: [...b.neighbourhoods],
}));
