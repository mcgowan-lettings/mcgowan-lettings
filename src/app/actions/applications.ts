"use server";

import { supabaseAdmin } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth";
import { buildApplicationPdf, londonDateParts } from "@/lib/application-pdf";
import type { TenantApplicationRow } from "@/lib/application-types";
import { copyFor } from "@/lib/application-copy";

export async function markApplicationRead(id: string, accessToken: string) {
  await requireAdmin(accessToken);
  const { error } = await supabaseAdmin
    .from("tenant_applications")
    .update({ read: true })
    .eq("id", id);
  if (error) {
    console.error("markApplicationRead error:", error);
    return { success: false, error: "Failed to update application." };
  }
  return { success: true, error: "" };
}

/** Server-side "mark all read" (see markAllSubmissionsRead): `upTo` is the
 * newest loaded `created_at`, so applications that arrived since stay unread. */
export async function markAllApplicationsRead(upTo: string | null, accessToken: string) {
  await requireAdmin(accessToken);
  let query = supabaseAdmin
    .from("tenant_applications")
    .update({ read: true })
    .or("read.is.null,read.eq.false");
  if (upTo) query = query.lte("created_at", upTo);
  const { error } = await query;
  if (error) {
    console.error("markAllApplicationsRead error:", error);
    return { success: false, error: "Failed to update applications." };
  }
  return { success: true, error: "" };
}

export async function deleteApplication(id: string, accessToken: string) {
  await requireAdmin(accessToken);
  const { error } = await supabaseAdmin
    .from("tenant_applications")
    .delete()
    .eq("id", id);
  if (error) {
    console.error("deleteApplication error:", error);
    return { success: false, error: "Failed to delete application." };
  }
  return { success: true, error: "" };
}

/** Admin-only list read (service role) — keeps PII out of the anon-key data path. */
export async function listApplications(accessToken: string): Promise<TenantApplicationRow[]> {
  await requireAdmin(accessToken);
  const { data, error } = await supabaseAdmin
    .from("tenant_applications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1000);
  if (error) {
    console.error("listApplications error:", error);
    throw new Error("Failed to load applications.");
  }
  return (data ?? []) as TenantApplicationRow[];
}

export async function countUnreadApplications(accessToken: string): Promise<number> {
  await requireAdmin(accessToken);
  const { count, error } = await supabaseAdmin
    .from("tenant_applications")
    .select("id", { count: "exact", head: true })
    .or("read.is.null,read.eq.false");
  if (error) {
    console.error("countUnreadApplications error:", error);
    throw new Error("Failed to count applications.");
  }
  return count ?? 0;
}

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "applicant"
  );
}

export async function getApplicationPdf(
  id: string,
  accessToken: string
): Promise<{ base64: string; filename: string }> {
  await requireAdmin(accessToken);
  const { data, error } = await supabaseAdmin
    .from("tenant_applications")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !data) {
    if (error) console.error("getApplicationPdf error:", error);
    throw new Error("Application not found");
  }
  const app = data as TenantApplicationRow;
  const pdf = await buildApplicationPdf(app);
  // UK local date, so a 00:30 BST submission isn't filed under the day before.
  const parts = londonDateParts(app.created_at);
  const date = parts ? `${parts.year}-${parts.month}-${parts.day}` : "undated";
  return {
    base64: Buffer.from(pdf).toString("base64"),
    filename: `${copyFor(app.application_type).filenamePrefix.toLowerCase()}-${slugify(app.full_name)}-${date}.pdf`,
  };
}
