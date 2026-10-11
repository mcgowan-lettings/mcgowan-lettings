import { cache } from "react";
import { supabaseAdmin } from "@/lib/supabase-server";

// PostgREST "no rows returned for .single()" and Postgres "invalid input
// syntax" (a non-uuid id in the URL) are genuine not-founds → null → 404.
// Anything else (timeouts, 5xx, network) is transient: throw, so the error
// boundary renders and ISR keeps serving the last good page instead of
// caching a 404 for a listing that still exists.
const NOT_FOUND_CODES = new Set(["PGRST116", "22P02"]);

export const getProperty = cache(async (id: string) => {
  const { data, error } = await supabaseAdmin
    .from("properties")
    .select("*")
    .eq("id", id)
    .single();
  if (error) {
    if (error.code && NOT_FOUND_CODES.has(error.code)) return null;
    throw new Error(`Failed to load property ${id}: ${error.message}`);
  }
  return data;
});
