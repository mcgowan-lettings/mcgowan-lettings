import { supabaseAdmin } from "@/lib/supabase-server";
import PropertiesPage from "./PropertiesClient";

// Cached statically; admin mutations call `revalidatePath("/properties")`
// so edits go live immediately. The 60s ceiling is a safety net.
export const revalidate = 60;

async function getProperties() {
  const { data } = await supabaseAdmin
    .from("properties")
    .select("id, title, price, location, area, beds, baths, type, images, status")
    .eq("active", true)
    .order("price", { ascending: false });

  return data ?? [];
}

export default async function Page() {
  const properties = await getProperties();
  return <PropertiesPage initialProperties={properties} />;
}
