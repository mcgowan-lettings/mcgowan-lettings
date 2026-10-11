import { supabaseAdmin } from "@/lib/supabase-server";
import HomePage from "./HomeClient";
import { getReviewCount } from "@/lib/get-review-count";
import { buildAreaList } from "./properties/filters";

export const revalidate = 60;

// Supabase errors throw (rather than returning []) so a failed ISR
// regeneration keeps serving the last good page instead of caching an empty
// featured grid / area list for 60s.
async function getFeaturedProperties() {
  const { data, error } = await supabaseAdmin
    .from("properties")
    .select("id, title, price, location, beds, baths, type, images, status, is_new")
    .eq("active", true)
    .eq("featured", true)
    .order("price", { ascending: false })
    .limit(6);

  if (error) throw new Error(`Failed to load featured properties: ${error.message}`);
  if (!data) return [];
  return data.length >= 6 ? data.slice(0, 6) : data.slice(0, 3);
}

// Hero search "Area" options come from live listings, so every option
// actually matches something on /properties.
async function getSearchAreas() {
  const { data, error } = await supabaseAdmin
    .from("properties")
    .select("area")
    .eq("active", true);

  if (error) throw new Error(`Failed to load property areas: ${error.message}`);
  return buildAreaList((data ?? []).map((p) => p.area));
}

export default async function Page() {
  const [featuredProperties, searchAreas, reviewCount] = await Promise.all([
    getFeaturedProperties(),
    getSearchAreas(),
    getReviewCount(),
  ]);
  return (
    <HomePage
      featuredProperties={featuredProperties}
      searchAreas={searchAreas}
      reviewCount={reviewCount ?? 370}
    />
  );
}
