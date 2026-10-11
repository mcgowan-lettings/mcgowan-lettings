import { supabaseAdmin } from "@/lib/supabase-server";
import PropertiesPage from "./PropertiesClient";

// Cached statically; admin mutations call `revalidatePath("/properties")`
// so edits go live immediately. The 60s ceiling is a safety net.
export const revalidate = 60;

async function getProperties() {
  const { data, error } = await supabaseAdmin
    .from("properties")
    .select("id, title, price, location, area, beds, baths, type, images, status, is_new")
    .eq("active", true)
    .order("price", { ascending: false });

  // Throw rather than render an empty list: a failed ISR regeneration keeps
  // serving the last good page instead of caching "0 properties" for 60s.
  if (error) throw new Error(`Failed to load properties: ${error.message}`);
  return data ?? [];
}

export default async function Page() {
  const properties = await getProperties();
  return <PropertiesPage initialProperties={properties} />;
}
