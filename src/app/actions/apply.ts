"use server";

import { headers } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-server";
import { getResend } from "@/lib/resend";
import { buildApplicationPdf } from "@/lib/application-pdf";
import { isWellFormedPng } from "@/lib/png-check";
import {
  EMPLOYMENT_STATUSES,
  type ApplicationFormData,
  type TenantApplicationRow,
} from "@/lib/application-types";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

type ApplicationResult = { success: true } | { success: false; error: string };

const MAX_SHORT = 500;
const MAX_LONG = 1000;
const MAX_SIGNATURE_BYTES = 200 * 1024;
const NI_REGEX = /^[A-CEGHJ-PR-TW-Z]{2}[0-9]{6}[A-D]?$/i;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const MAX_PER_IP_PER_HOUR = 5;
const MAX_PER_EMAIL_PER_DAY = 3;

function str(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function parseIsoDate(s: string): Date | null {
  if (!ISO_DATE_REGEX.test(s)) return null;
  const d = new Date(`${s}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  // Reject things like 2024-02-31 that Date silently rolls over.
  if (d.toISOString().slice(0, 10) !== s) return null;
  return d;
}

function ageInYears(dob: Date, now: Date): number {
  let age = now.getUTCFullYear() - dob.getUTCFullYear();
  const m = now.getUTCMonth() - dob.getUTCMonth();
  if (m < 0 || (m === 0 && now.getUTCDate() < dob.getUTCDate())) age--;
  return age;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}

function maskNi(ni: string): string {
  if (ni.length <= 3) return ni;
  return "*".repeat(ni.length - 3) + ni.slice(-3);
}

function safeFilename(name: string): string {
  const cleaned = name.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "");
  return `Application-${cleaned || "Applicant"}.pdf`;
}

function row(label: string, value: string): string {
  return `<tr>
    <td style="padding: 8px 0; font-weight: bold; color: #555; width: 160px; vertical-align: top;">${escapeHtml(label)}:</td>
    <td style="padding: 8px 0; color: #1a1a1a; white-space: pre-wrap;">${escapeHtml(value)}</td>
  </tr>`;
}

export async function submitApplication(data: ApplicationFormData): Promise<ApplicationResult> {
  if (!data || typeof data !== "object") {
    return { success: false, error: "Invalid submission." };
  }

  // Honeypot — silently succeed so bots don't retry.
  if (typeof data.website === "string" && data.website.trim()) {
    return { success: true };
  }

  // --- Normalise ---------------------------------------------------------
  const property_address = str(data.property_address, MAX_LONG);
  const rent_pcm = str(data.rent_pcm, 50);
  const full_name = str(data.full_name, MAX_SHORT);
  const email = str(data.email, MAX_SHORT);
  const phone = str(data.phone, 50);
  const date_of_birth = str(data.date_of_birth, 10);
  const ni_number = str(data.ni_number, 20).replace(/\s+/g, "").toUpperCase();
  const current_address = str(data.current_address, MAX_LONG);
  const period_at_address = str(data.period_at_address, MAX_SHORT);
  const employment_status = str(data.employment_status, 100);
  const employer = str(data.employer, MAX_SHORT);
  const job_title = str(data.job_title, MAX_SHORT);
  const employment_start_date = str(data.employment_start_date, 10);
  const monthly_income = str(data.monthly_income, 50);
  const signed_name = str(data.signed_name, MAX_SHORT);
  const signature_data_url = typeof data.signature_data_url === "string" ? data.signature_data_url : "";
  const declaration_agreed = data.declaration_agreed === true;

  // --- Validate ----------------------------------------------------------
  if (!property_address) return { success: false, error: "Property address is required." };
  if (!full_name) return { success: false, error: "Full name is required." };
  if (!email) return { success: false, error: "Email is required." };
  if (!EMAIL_REGEX.test(email)) return { success: false, error: "Please enter a valid email address." };
  if (!phone) return { success: false, error: "Phone number is required." };
  if (phone.replace(/\D/g, "").length < 7) {
    return { success: false, error: "Please enter a valid phone number." };
  }

  if (!date_of_birth) return { success: false, error: "Date of birth is required." };
  const dob = parseIsoDate(date_of_birth);
  if (!dob) return { success: false, error: "Please enter a valid date of birth." };
  const age = ageInYears(dob, new Date());
  if (age < 18) return { success: false, error: "Applicants must be at least 18 years old." };
  if (age > 120) return { success: false, error: "Please enter a valid date of birth." };

  if (!ni_number) return { success: false, error: "National Insurance number is required." };
  if (!NI_REGEX.test(ni_number)) {
    return { success: false, error: "Please enter a valid National Insurance number (e.g. AB 12 34 56 C)." };
  }

  if (!current_address) return { success: false, error: "Current address is required." };
  if (!period_at_address) return { success: false, error: "Period at current address is required." };

  if (!(EMPLOYMENT_STATUSES as readonly string[]).includes(employment_status)) {
    return { success: false, error: "Please select your employment status." };
  }
  const needsEmployer =
    employment_status.startsWith("Employed") || employment_status === "Self-employed";
  if (needsEmployer) {
    if (!employer) return { success: false, error: "Employer is required." };
    if (!job_title) return { success: false, error: "Job title is required." };
    if (!employment_start_date) return { success: false, error: "Employment start date is required." };
  }
  if (employment_start_date && !parseIsoDate(employment_start_date)) {
    return { success: false, error: "Please enter a valid employment start date." };
  }

  if (!monthly_income) return { success: false, error: "Monthly income is required." };
  if (!declaration_agreed) return { success: false, error: "You must agree to the declaration." };
  if (!signed_name) return { success: false, error: "Please print your name to sign." };

  const SIG_PREFIX = "data:image/png;base64,";
  if (!signature_data_url.startsWith(SIG_PREFIX)) {
    return { success: false, error: "Please provide your signature." };
  }
  const sigB64 = signature_data_url.slice(SIG_PREFIX.length);
  if (!sigB64 || !/^[A-Za-z0-9+/=]+$/.test(sigB64)) {
    return { success: false, error: "Signature image is invalid." };
  }
  const sigBytes = Buffer.from(sigB64, "base64");
  if (sigBytes.length === 0 || sigBytes.length > MAX_SIGNATURE_BYTES) {
    return { success: false, error: "Signature image is too large. Please clear and sign again." };
  }
  // A truncated/corrupt PNG can hang pdf-lib's decoder — reject anything malformed up front.
  if (!isWellFormedPng(new Uint8Array(sigBytes))) {
    return { success: false, error: "Signature image is invalid. Please clear and sign again." };
  }

  // --- Request metadata ----------------------------------------------------
  let ip_address: string | null = null;
  let user_agent: string | null = null;
  try {
    const h = await headers();
    const fwd = h.get("x-forwarded-for");
    ip_address = fwd ? fwd.split(",")[0].trim().slice(0, 100) || null : null;
    user_agent = h.get("user-agent")?.slice(0, MAX_SHORT) || null;
  } catch {
    // headers() unavailable outside a request — leave null.
  }

  // --- Throttle ------------------------------------------------------------
  // This action emails an applicant-supplied address with a branded PDF, so cap
  // submissions per IP and per email to stop bots burning Resend quota or using
  // us as a spam relay. Fails closed with a generic error.
  try {
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const [byIp, byEmail] = await Promise.all([
      ip_address
        ? supabaseAdmin
            .from("tenant_applications")
            .select("id", { count: "exact", head: true })
            .eq("ip_address", ip_address)
            .gte("created_at", hourAgo)
        : Promise.resolve({ count: 0, error: null }),
      supabaseAdmin
        .from("tenant_applications")
        .select("id", { count: "exact", head: true })
        .ilike("email", email)
        .gte("created_at", dayAgo),
    ]);
    if (byIp.error || byEmail.error) {
      console.error("Application throttle check error:", byIp.error ?? byEmail.error);
      return { success: false, error: "Something went wrong. Please try again." };
    }
    if ((byIp.count ?? 0) >= MAX_PER_IP_PER_HOUR || (byEmail.count ?? 0) >= MAX_PER_EMAIL_PER_DAY) {
      return {
        success: false,
        error: "Too many applications have been submitted recently. Please try again later or call us on 0161 797 6967.",
      };
    }
  } catch (err) {
    console.error("Application throttle check error:", err);
    return { success: false, error: "Something went wrong. Please try again." };
  }

  // --- Insert --------------------------------------------------------------
  try {
    const { data: inserted, error } = await supabaseAdmin
      .from("tenant_applications")
      .insert({
        property_address,
        rent_pcm: rent_pcm || null,
        full_name,
        email,
        phone,
        date_of_birth,
        ni_number,
        current_address,
        period_at_address,
        employment_status,
        employer: needsEmployer ? employer : employer || null,
        job_title: needsEmployer ? job_title : job_title || null,
        employment_start_date: employment_start_date || null,
        monthly_income,
        declaration_agreed: true,
        signature_data_url,
        signed_name,
        signed_at: new Date().toISOString(),
        ip_address,
        user_agent,
        read: false,
      })
      .select("*")
      .single<TenantApplicationRow>();

    if (error || !inserted) {
      console.error("Supabase tenant_applications insert error:", error);
      return { success: false, error: "Something went wrong. Please try again." };
    }

    // --- Emails (never fail the submission) --------------------------------
    try {
      const pdf = await buildApplicationPdf(inserted);
      const attachments = [{ filename: safeFilename(full_name), content: Buffer.from(pdf) }];
      const resend = getResend();
      const from = "McGowan Lettings <notifications@mcgowanlettings.co.uk>";

      const adminHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a1a1a; border-bottom: 2px solid #abd300; padding-bottom: 10px;">
            New Tenant Application
          </h2>
          <table style="width: 100%; border-collapse: collapse;">
            ${row("Property", property_address)}
            ${row("Rent", rent_pcm || "—")}
            ${row("Full name", full_name)}
            ${row("Email", email)}
            ${row("Phone", phone)}
            ${row("Date of birth", formatDate(date_of_birth))}
            ${row("NI number", maskNi(ni_number))}
            ${row("Current address", current_address)}
            ${row("Period at address", period_at_address)}
            ${row("Employment status", employment_status)}
            ${row("Employer", employer || "—")}
            ${row("Job title", job_title || "—")}
            ${row("Start date", employment_start_date ? formatDate(employment_start_date) : "—")}
            ${row("Monthly income", monthly_income)}
            ${row("Declaration agreed", "Yes")}
            ${row("Signed as", signed_name)}
          </table>
          <p style="margin-top: 20px; color: #1a1a1a;">
            The signed application is attached as a PDF (full NI number included).
          </p>
          <p style="margin-top: 16px;">
            <a href="https://www.mcgowanlettings.co.uk/admin/applications"
               style="display: inline-block; background: #abd300; color: #1a1a1a; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-weight: bold;">
              View in admin
            </a>
          </p>
          <p style="margin-top: 20px; font-size: 12px; color: #999;">
            You can reply directly to this email to respond to ${escapeHtml(full_name)}.
          </p>
        </div>
      `;

      const applicantHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a1a1a; border-bottom: 2px solid #abd300; padding-bottom: 10px;">
            Thanks, ${escapeHtml(full_name.split(" ")[0])} — we've received your application
          </h2>
          <p style="color: #1a1a1a; line-height: 1.6;">
            Thank you for applying for <strong>${escapeHtml(property_address)}</strong>.
            A copy of your signed application is attached to this email for your records.
          </p>
          <p style="color: #1a1a1a; line-height: 1.6;">
            David will review your details and be in touch shortly. If you have any questions in
            the meantime, just reply to this email or call us on 0161 797 6967.
          </p>
          <p style="color: #1a1a1a; line-height: 1.6; margin-top: 24px;">
            Kind regards,<br />
            <strong>McGowan Lettings</strong>
          </p>
          <p style="margin-top: 20px; font-size: 12px; color: #999;">
            McGowan Residential Lettings Ltd · PO Box 546, Bury, Lancashire BL8 9HB · mcgowanlettings.co.uk
          </p>
        </div>
      `;

      const results = await Promise.allSettled([
        resend.emails.send({
          from,
          to: "info@mcgowanlettings.co.uk",
          replyTo: email,
          subject: `New Tenant Application — ${full_name} — ${property_address}`.replace(/[\r\n]+/g, " "),
          html: adminHtml,
          attachments,
        }),
        resend.emails.send({
          from,
          to: email,
          replyTo: "info@mcgowanlettings.co.uk",
          subject: "Your application to McGowan Lettings — copy for your records",
          html: applicantHtml,
          attachments,
        }),
      ]);
      results.forEach((r, i) => {
        if (r.status === "rejected") {
          console.error(`Application email ${i === 0 ? "(admin)" : "(applicant)"} error:`, r.reason);
        } else if (r.value.error) {
          console.error(`Application email ${i === 0 ? "(admin)" : "(applicant)"} error:`, r.value.error);
        }
      });
    } catch (emailErr) {
      // Log but don't fail the submission — the application is saved in Supabase
      console.error("Application email/PDF error:", emailErr);
    }

    return { success: true };
  } catch (err) {
    console.error("Application submission error:", err);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
