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
// Every column except signature_data_url (~40-70KB each): with it, the list
// payload grows ~42KB per application and would eventually exceed the
// function response limit. The signature is fetched per row on expand.
const LIST_COLUMNS =
  "id, application_type, property_address, tenant_name, rent_pcm, full_name, email, phone, date_of_birth, ni_number, current_address, period_at_address, employment_status, employer, job_title, employment_start_date, monthly_income, declaration_agreed, declaration_text, signed_name, signed_at, ip_address, user_agent, read, created_at";

export async function listApplications(accessToken: string): Promise<TenantApplicationRow[]> {
  await requireAdmin(accessToken);
  const { data, error } = await supabaseAdmin
    .from("tenant_applications")
    .select(LIST_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(1000);
  if (error) {
    console.error("listApplications error:", error.code, error.message);
    throw new Error("Failed to load applications.");
  }
  return ((data ?? []) as unknown as Omit<TenantApplicationRow, "signature_data_url">[]).map((row) => ({
    ...row,
    signature_data_url: "",
  }));
}

/** Signature image for one application (loaded when its row is expanded). */
export async function getApplicationSignature(id: string, accessToken: string): Promise<string | null> {
  await requireAdmin(accessToken);
  const { data, error } = await supabaseAdmin
    .from("tenant_applications")
    .select("signature_data_url")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.error("getApplicationSignature error:", error.code, error.message);
    return null;
  }
  return (data?.signature_data_url as string | null) ?? null;
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
