"use server";

import { supabaseAdmin } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth";
import { buildApplicationPdf } from "@/lib/application-pdf";
import type { TenantApplicationRow } from "@/lib/application-types";

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

export async function markAllApplicationsRead(ids: string[], accessToken: string) {
  await requireAdmin(accessToken);
  const { error } = await supabaseAdmin
    .from("tenant_applications")
    .update({ read: true })
    .in("id", ids);
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
    .eq("read", false);
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
  const date = new Date(app.created_at).toISOString().split("T")[0];
  return {
    base64: Buffer.from(pdf).toString("base64"),
    filename: `application-${slugify(app.full_name)}-${date}.pdf`,
  };
}
