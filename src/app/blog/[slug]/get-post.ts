import { cache } from "react";
import { supabaseAdmin } from "@/lib/supabase-server";

export const getPost = cache(async (slug: string) => {
  const { data, error } = await supabaseAdmin
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .single();
  // Only "no row" means not found. Throw on anything else so a transient
  // Supabase error during ISR keeps serving the last good page instead of
  // caching a 404 for a live post.
  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`getPost(${slug}) failed: ${error.message}`);
  }
  return data;
});
