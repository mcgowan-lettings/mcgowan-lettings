"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth";
import { sanitizeHtml } from "@/lib/sanitize-html";

// Storage paths are derived from public URLs; warn instead of silently
// skipping when a URL doesn't contain the expected bucket segment.
function extractStoragePath(url: string | null | undefined): string | null {
  if (!url) return null;
  const path = url.split("/property-images/")[1];
  if (!path) {
    console.warn("Could not derive storage path from URL:", url);
    return null;
  }
  return path;
}

export async function checkIsAdmin(accessToken: string): Promise<boolean> {
  try {
    await requireAdmin(accessToken);
    return true;
  } catch {
    return false;
  }
}

export async function revalidateBlog(slug?: string) {
  revalidatePath("/blog");
  if (slug) {
    revalidatePath(`/blog/${slug}`);
  }
}

export async function revalidateProperty(id?: string) {
  revalidatePath("/properties");
  revalidatePath("/");
  if (id) {
    revalidatePath(`/properties/${id}`);
  }
}

export async function deleteProperty(id: string, imageUrls: string[], accessToken: string) {
  await requireAdmin(accessToken);
  const { error } = await supabaseAdmin
    .from("properties")
    .delete()
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  // Storage cleanup after the row is gone — if removal fails the worst case is
  // an orphaned file (cleanupOrphans reaps it), not a live listing with dead images.
  const paths = imageUrls.map(extractStoragePath).filter((p): p is string => p !== null);
  if (paths.length) {
    await supabaseAdmin.storage.from("property-images").remove(paths);
  }
  revalidatePath("/properties");
  revalidatePath("/");
  // Detail page is ISR — drop the cached HTML so the deleted URL 404s now.
  revalidatePath(`/properties/${id}`);
  return { success: true, error: "" };
}

export async function deleteBlogPost(id: string, coverImage: string | null, accessToken: string, slug?: string) {
  await requireAdmin(accessToken);
  const { error } = await supabaseAdmin
    .from("blog_posts")
    .delete()
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  // Storage cleanup after the row is gone (see deleteProperty).
  const coverPath = extractStoragePath(coverImage);
  if (coverPath) {
    await supabaseAdmin.storage.from("property-images").remove([coverPath]);
  }
  revalidatePath("/blog");
  // Blog post page is now ISR — explicitly invalidate the deleted slug so
  // the cached HTML doesn't keep serving a 404'd post for up to 60s.
  if (slug) revalidatePath(`/blog/${slug}`);
  return { success: true, error: "" };
}

/* ── Property mutations ── */

export type PropertyData = {
  title: string;
  description: string | null;
  price: number;
  location: string;
  area: string;
  beds: number;
  baths: number;
  type: string;
  active: boolean;
  featured: boolean;
  images: string[];
  videos: string[];
  status: string;
  furnished: string;
  available_from: string | null;
  council_tax_band: string | null;
  epc_document: string | null;
  features: string[] | null;
};

export async function createProperty(data: PropertyData, accessToken: string) {
  await requireAdmin(accessToken);
  // Sanitize rich text on write as well as render — stored HTML stays clean
  // even if a future render path forgets to.
  if (data.description) data.description = sanitizeHtml(data.description);
  const { error } = await supabaseAdmin.from("properties").insert(data);
  if (error) return { success: false, error: error.message };
  revalidatePath("/properties");
  revalidatePath("/");
  return { success: true, error: "" };
}

export async function updateProperty(id: string, data: Partial<PropertyData> & { updated_at: string }, accessToken: string) {
  await requireAdmin(accessToken);
  if (data.description) data.description = sanitizeHtml(data.description);
  const { error } = await supabaseAdmin.from("properties").update(data).eq("id", id);
  if (error) return { success: false, error: error.message };
  revalidatePath("/properties");
  revalidatePath("/");
  revalidatePath(`/properties/${id}`);
  return { success: true, error: "" };
}

export async function togglePropertyActive(id: string, active: boolean, accessToken: string) {
  await requireAdmin(accessToken);
  const { error } = await supabaseAdmin
    .from("properties")
    .update({ active, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { success: false, error: error.message };
  revalidatePath("/properties");
  revalidatePath("/");
  // Detail page is ISR — deactivating should 404 immediately, not after 60s.
  revalidatePath(`/properties/${id}`);
  return { success: true, error: "" };
}

export async function togglePropertyFeatured(id: string, featured: boolean, accessToken: string) {
  await requireAdmin(accessToken);
  const { error } = await supabaseAdmin
    .from("properties")
    .update({ featured, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { success: false, error: error.message };
  revalidatePath("/properties");
  revalidatePath("/");
  return { success: true, error: "" };
}

/* ── Blog mutations ── */

export type BlogPostData = {
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  cover_image: string | null;
  published: boolean;
};

export async function createBlogPost(data: BlogPostData, accessToken: string) {
  await requireAdmin(accessToken);

  const { data: existing } = await supabaseAdmin
    .from("blog_posts")
    .select("id")
    .eq("slug", data.slug)
    .maybeSingle();

  if (existing) return { success: false, error: "A blog post with this URL slug already exists." };

  if (data.content) data.content = sanitizeHtml(data.content);
  const { error } = await supabaseAdmin.from("blog_posts").insert(data);
  if (error) return { success: false, error: error.message };
  revalidatePath("/blog");
  revalidatePath(`/blog/${data.slug}`);
  return { success: true, error: "" };
}

export async function updateBlogPost(id: string, data: Partial<BlogPostData> & { updated_at: string }, accessToken: string) {
  await requireAdmin(accessToken);
  if (data.content) data.content = sanitizeHtml(data.content);
  const { error } = await supabaseAdmin.from("blog_posts").update(data).eq("id", id);
  if (error) return { success: false, error: error.message };
  revalidatePath("/blog");
  if (data.slug) revalidatePath(`/blog/${data.slug}`);
  return { success: true, error: "" };
}

export async function deleteSubmission(id: string, accessToken: string) {
  await requireAdmin(accessToken);
  const { error } = await supabaseAdmin
    .from("contact_submissions")
    .delete()
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true, error: "" };
}

export async function toggleBlogPublished(id: string, published: boolean, accessToken: string) {
  await requireAdmin(accessToken);
  const { error } = await supabaseAdmin
    .from("blog_posts")
    .update({ published, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { success: false, error: error.message };
  revalidatePath("/blog");
  return { success: true, error: "" };
}

/* ── Submission / valuation read-state mutations ── */

export async function markSubmissionRead(id: string, accessToken: string) {
  await requireAdmin(accessToken);
  const { error } = await supabaseAdmin
    .from("contact_submissions")
    .update({ read: true })
    .eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true, error: "" };
}

export async function markAllSubmissionsRead(ids: string[], accessToken: string) {
  await requireAdmin(accessToken);
  const { error } = await supabaseAdmin
    .from("contact_submissions")
    .update({ read: true })
    .in("id", ids);
  if (error) return { success: false, error: error.message };
  return { success: true, error: "" };
}

export async function markValuationRead(id: string, accessToken: string) {
  await requireAdmin(accessToken);
  const { error } = await supabaseAdmin
    .from("valuation_requests")
    .update({ read: true })
    .eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true, error: "" };
}

export async function markAllValuationsRead(ids: string[], accessToken: string) {
  await requireAdmin(accessToken);
  const { error } = await supabaseAdmin
    .from("valuation_requests")
    .update({ read: true })
    .in("id", ids);
  if (error) return { success: false, error: error.message };
  return { success: true, error: "" };
}

export async function updateReviewCount(count: number, accessToken: string) {
  await requireAdmin(accessToken);
  if (!Number.isInteger(count) || count < 0) {
    return { success: false, error: "Count must be a whole number." };
  }
  const { error } = await supabaseAdmin
    .from("site_config")
    .upsert(
      { key: "google_review_count", value: String(count), updated_at: new Date().toISOString() },
      { onConflict: "key" }
    );
  if (error) return { success: false, error: error.message };
  revalidatePath("/");
  return { success: true, error: "" };
}

export async function deleteValuationRequest(id: string, accessToken: string) {
  await requireAdmin(accessToken);
  const { error } = await supabaseAdmin
    .from("valuation_requests")
    .delete()
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true, error: "" };
}
