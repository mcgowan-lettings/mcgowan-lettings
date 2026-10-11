import { MetadataRoute } from "next";
import { supabaseAdmin } from "@/lib/supabase-server";
import { SITE_URL } from "@/lib/site";

// Without this the sitemap is prerendered once at deploy and new listings and
// posts never appear until the next push. Admin actions also call
// revalidatePath("/sitemap.xml") so it refreshes immediately on change.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_URL;

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: "weekly", priority: 1.0 },
    { url: `${baseUrl}/properties`, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/landlords`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/tenants`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/valuation`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/blog`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/contact`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/terms`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/complaints`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/areas`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/areas/bury`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/areas/bolton`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/areas/manchester`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/areas/rochdale`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/areas/rossendale`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/areas/accrington`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/areas/burnley`, changeFrequency: "monthly", priority: 0.7 },
  ];

  // Dynamic property pages. The hard limit is generous (David has ~18 active
  // listings; the limit just prevents an unbounded query from timing out the
  // sitemap if the table ever balloons).
  // Throw on query errors: a failed ISR regeneration then keeps serving the
  // last good sitemap instead of caching one with every listing missing.
  const { data: properties, error: propertiesError } = await supabaseAdmin
    .from("properties")
    .select("id, updated_at")
    .eq("active", true)
    .limit(5000);
  if (propertiesError) throw new Error(`sitemap: properties query failed: ${propertiesError.message}`);

  const propertyPages: MetadataRoute.Sitemap = (properties ?? []).map((p) => ({
    url: `${baseUrl}/properties/${p.id}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // Dynamic blog pages. Same rationale as the property limit above.
  const { data: posts, error: postsError } = await supabaseAdmin
    .from("blog_posts")
    .select("slug, updated_at")
    .eq("published", true)
    .limit(5000);
  if (postsError) throw new Error(`sitemap: blog query failed: ${postsError.message}`);

  const blogPages: MetadataRoute.Sitemap = (posts ?? []).map((p) => ({
    url: `${baseUrl}/blog/${p.slug}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...propertyPages, ...blogPages];
}
