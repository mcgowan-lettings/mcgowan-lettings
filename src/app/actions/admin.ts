"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase-server";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

async function requireAdmin(accessToken: string) {
  if (!accessToken) throw new Error("Unauthorized");
  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(accessToken);
  if (error || !user) throw new Error("Unauthorized");
  if (ADMIN_EMAILS.length === 0 || !ADMIN_EMAILS.includes(user.email?.toLowerCase() ?? "")) {
    throw new Error("Forbidden");
  }
  return user;
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
  // Remove images from storage
  for (const url of imageUrls) {
    const path = url.split("/property-images/")[1];
    if (path) {
      await supabaseAdmin.storage.from("property-images").remove([path]);
    }
  }

  const { error } = await supabaseAdmin
    .from("properties")
    .delete()
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }
  revalidatePath("/properties");
  revalidatePath("/");
  return { success: true, error: "" };
}

export async function deleteBlogPost(id: string, coverImage: string | null, accessToken: string) {
  await requireAdmin(accessToken);
  // Remove cover image from storage
  if (coverImage) {
    const path = coverImage.split("/property-images/")[1];
    if (path) {
      await supabaseAdmin.storage.from("property-images").remove([path]);
    }
  }

  const { error } = await supabaseAdmin
    .from("blog_posts")
    .delete()
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }
  revalidatePath("/blog");
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
  const { error } = await supabaseAdmin.from("properties").insert(data);
  if (error) return { success: false, error: error.message };
  revalidatePath("/properties");
  revalidatePath("/");
  return { success: true, error: "" };
}

export async function updateProperty(id: string, data: Partial<PropertyData> & { updated_at: string }, accessToken: string) {
  await requireAdmin(accessToken);
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

  const { error } = await supabaseAdmin.from("blog_posts").insert(data);
  if (error) return { success: false, error: error.message };
  revalidatePath("/blog");
  revalidatePath(`/blog/${data.slug}`);
  return { success: true, error: "" };
}

export async function updateBlogPost(id: string, data: Partial<BlogPostData> & { updated_at: string }, accessToken: string) {
  await requireAdmin(accessToken);
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
