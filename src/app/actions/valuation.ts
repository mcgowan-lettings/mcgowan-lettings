"use server";

import { supabaseAdmin } from "@/lib/supabase-server";
import { getResend } from "@/lib/resend";
import { checkLeadThrottle, clientIp, isRecentDuplicate, isSafeLeadEmail, plainSubject, sendPausedNotice } from "@/lib/form-throttle";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Truncate by code point, not UTF-16 unit: slicing inside an emoji leaves a
// lone surrogate, which Postgres rejects — the user would then get "Something
// went wrong" on every retry.
function str(v: unknown, max: number): string {
  // NUL bytes make Postgres reject the insert (22P05) on every retry.
  return typeof v === "string" ? Array.from(v.replace(/\u0000/g, "").trim()).slice(0, max).join("").trim() : "";
}

const MAX_SHORT = 200;
const MAX_LONG = 500;
const MAX_MESSAGE = 5000;

type ValuationResult =
  | { success: true }
  | { success: false; error: string };

export async function submitValuationForm(formData: {
  name: string;
  email: string;
  phone: string;
  address: string;
  property_type?: string;
  bedrooms?: string;
  situation?: string;
  message?: string;
  website?: string;
}): Promise<ValuationResult> {
  if (!formData || typeof formData !== "object") {
    return { success: false, error: "Invalid submission." };
  }
  const { website } = formData;

  if (typeof website === "string" && website.trim()) {
    return { success: true };
  }

  // Truncate rather than reject over-long input (matches apply.ts)
  const name = str(formData.name, MAX_SHORT);
  const email = str(formData.email, MAX_SHORT);
  const phone = str(formData.phone, MAX_SHORT);
  const address = str(formData.address, MAX_LONG);
  const property_type = str(formData.property_type, MAX_SHORT);
  const bedrooms = str(formData.bedrooms, MAX_SHORT);
  const situation = str(formData.situation, MAX_SHORT);
  const message = str(formData.message, MAX_MESSAGE);

  // Validate required fields
  if (!name || !name.trim()) {
    return { success: false, error: "Name is required." };
  }
  if (!email || !email.trim()) {
    return { success: false, error: "Email is required." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return { success: false, error: "Please enter a valid email address." };
  }
  if (!phone || !phone.trim()) {
    return { success: false, error: "Phone number is required." };
  }
  if (!address || !address.trim()) {
    return { success: false, error: "Property address is required." };
  }

  if (!isSafeLeadEmail(email.trim())) {
    return { success: false, error: "Please enter a valid email address." };
  }

  // A resend after a dropped connection: already saved and emailed.
  if (
    await isRecentDuplicate("valuation_requests", email.trim(), {
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      property_type: property_type?.trim() || null,
      bedrooms: bedrooms?.trim() || null,
      situation: situation?.trim() || null,
      message: message?.trim() || null,
    })
  ) {
    return { success: true };
  }

  const ip_address = await clientIp();
  const TOO_MANY = {
    success: false as const,
    error: "You've sent several messages in the last hour — we'll be in touch. For anything urgent, call 0161 797 6967.",
  };
  // Cheap early reject; the authoritative check runs after the insert.
  const precheck = await checkLeadThrottle("valuation_requests", email.trim(), ip_address, false);
  if (!precheck.allowed) {
    return TOO_MANY;
  }

  try {
    const { data: inserted, error } = await supabaseAdmin.from("valuation_requests").insert({
      ip_address,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      address: address.trim(),
      property_type: property_type?.trim() || null,
      bedrooms: bedrooms?.trim() || null,
      situation: situation?.trim() || null,
      message: message?.trim() || null,
      read: false,
    }).select("id").single();

    if (error) {
      console.error("Supabase valuation insert error:", error.code, error.message);
      return { success: false, error: "Something went wrong. Please try again." };
    }

    // Re-count with this row included (see checkLeadThrottle): concurrent
    // bursts can't exceed the caps. Over → remove our own row, no email.
    const throttle = await checkLeadThrottle("valuation_requests", email.trim(), ip_address, true);
    if (!throttle.allowed) {
      if (inserted?.id) {
        const { error: delError } = await supabaseAdmin.from("valuation_requests").delete().eq("id", inserted.id);
        if (delError) console.error("Throttled valuation_requests cleanup error:", delError.code, delError.message);
      }
      return TOO_MANY;
    }

    // Send email notification to David
    // Resend returns { error } rather than throwing on API failures.
    if (!throttle.sendEmail) await sendPausedNotice("valuation");
    if (throttle.sendEmail) {
      try {
        const { error: sendError } = await getResend().emails.send({
          from: "McGowan Lettings <notifications@mcgowanlettings.co.uk>",
          to: "info@mcgowanlettings.co.uk",
          replyTo: email.trim(),
          subject: plainSubject(`New Valuation Request from ${name.trim()} — ${address.trim()}`),
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #1a1a1a; border-bottom: 2px solid #abd300; padding-bottom: 10px;">
                New Valuation Request
              </h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555; width: 140px;">Name:</td>
                  <td style="padding: 8px 0; color: #1a1a1a;">${escapeHtml(name.trim())}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555;">Email:</td>
                  <td style="padding: 8px 0; color: #1a1a1a;">${escapeHtml(email.trim())}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555;">Phone:</td>
                  <td style="padding: 8px 0; color: #1a1a1a;">${escapeHtml(phone.trim())}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555;">Property Address:</td>
                  <td style="padding: 8px 0; color: #1a1a1a;">${escapeHtml(address.trim())}</td>
                </tr>
                ${property_type?.trim() ? `<tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555;">Property Type:</td>
                  <td style="padding: 8px 0; color: #1a1a1a;">${escapeHtml(property_type.trim())}</td>
                </tr>` : ""}
                ${bedrooms?.trim() ? `<tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555;">Bedrooms:</td>
                  <td style="padding: 8px 0; color: #1a1a1a;">${escapeHtml(bedrooms.trim())}</td>
                </tr>` : ""}
                ${situation?.trim() ? `<tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555;">Situation:</td>
                  <td style="padding: 8px 0; color: #1a1a1a;">${escapeHtml(situation.trim())}</td>
                </tr>` : ""}
              </table>
              ${message?.trim() ? `
              <div style="margin-top: 20px; padding: 15px; background: #f8f8f6; border-radius: 8px;">
                <p style="font-weight: bold; color: #555; margin: 0 0 8px 0;">Additional Information:</p>
                <p style="color: #1a1a1a; margin: 0; white-space: pre-wrap;">${escapeHtml(message.trim())}</p>
              </div>` : ""}
              <p style="margin-top: 20px; font-size: 12px; color: #999;">
                You can reply directly to this email to respond to ${escapeHtml(name.trim())}.
              </p>
            </div>
          `,
        });
        if (sendError) console.error("Valuation email notification error:", sendError);
      } catch (emailErr) {
        // Log but don't fail the submission — the data is saved in Supabase
        console.error("Valuation email notification error:", emailErr);
      }
    }

    return { success: true };
  } catch (err) {
    console.error("Valuation form submission error:", err);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
