import { supabaseAdmin } from "@/lib/supabase-server";
import HomePage from "./HomeClient";
import { getReviewCount } from "@/lib/get-review-count";

export const revalidate = 60;

async function getFeaturedProperties() {
  const { data } = await supabaseAdmin
    .from("properties")
    .select("id, title, price, location, beds, baths, type, images, status, is_new")
    .eq("active", true)
    .eq("featured", true)
    .order("price", { ascending: false })
    .limit(6);

  if (!data) return [];
  return data.length >= 6 ? data.slice(0, 6) : data.slice(0, 3);
}

export default async function Page() {
  const [featuredProperties, reviewCount] = await Promise.all([
    getFeaturedProperties(),
    getReviewCount(),
  ]);
  return <HomePage featuredProperties={featuredProperties} reviewCount={reviewCount ?? 370} />;
}
