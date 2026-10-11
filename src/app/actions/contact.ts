"use server";

import { supabaseAdmin } from "@/lib/supabase-server";
import { getResend } from "@/lib/resend";
import { checkLeadThrottle, clientIp, isRecentDuplicate, plainSubject, sendPausedNotice } from "@/lib/form-throttle";

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
  return typeof v === "string" ? Array.from(v.trim()).slice(0, max).join("").trim() : "";
}

const MAX_SHORT = 200;
const MAX_MESSAGE = 5000;

type ContactResult =
  | { success: true }
  | { success: false; error: string };

export async function submitContactForm(formData: {
  name: string;
  email: string;
  phone?: string;
  type?: string;
  message: string;
  /** Honeypot — must be empty. Any value indicates a bot. */
  website?: string;
}): Promise<ContactResult> {
  if (!formData || typeof formData !== "object") {
    return { success: false, error: "Invalid submission." };
  }
  const { website } = formData;

  // Honeypot: silently succeed so bots don't retry
  if (typeof website === "string" && website.trim()) {
    return { success: true };
  }

  // Truncate rather than reject over-long input (matches apply.ts)
  const name = str(formData.name, MAX_SHORT);
  const email = str(formData.email, MAX_SHORT);
  const phone = str(formData.phone, MAX_SHORT);
  const type = str(formData.type, MAX_SHORT);
  const message = str(formData.message, MAX_MESSAGE);

  // Validate required fields
  if (!name || !name.trim()) {
    return { success: false, error: "Name is required." };
  }
  if (!email || !email.trim()) {
    return { success: false, error: "Email is required." };
  }
  // Basic email format check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return { success: false, error: "Please enter a valid email address." };
  }
  if (!message || !message.trim()) {
    return { success: false, error: "Message is required." };
  }

  // A resend after a dropped connection: already saved and emailed.
  if (await isRecentDuplicate("contact_submissions", email.trim(), "message", message.trim())) {
    return { success: true };
  }

  const ip_address = await clientIp();
  const throttle = await checkLeadThrottle("contact_submissions", email.trim(), ip_address);
  if (!throttle.allowed) {
    return {
      success: false,
      error: "You've sent several messages in the last hour — we'll be in touch. For anything urgent, call 0161 797 6967.",
    };
  }

  try {
    const { error } = await supabaseAdmin.from("contact_submissions").insert({
      ip_address,
      name: name.trim(),
      email: email.trim(),
      phone: phone?.trim() || null,
      type: type?.trim() || "General",
      message: message.trim(),
      read: false,
    });

    if (error) {
      console.error("Supabase contact insert error:", error.code, error.message);
      return { success: false, error: "Something went wrong. Please try again." };
    }

    // Send email notification to David
    // Resend returns { error } rather than throwing on API failures.
    if (throttle.sendPausedNotice) await sendPausedNotice("contact");
    if (throttle.sendEmail) {
      try {
        const { error: sendError } = await getResend().emails.send({
          from: "McGowan Lettings <notifications@mcgowanlettings.co.uk>",
          to: "info@mcgowanlettings.co.uk",
          replyTo: email.trim(),
          subject: plainSubject(`New enquiry (${type || "General"}) from ${name.trim()}`),
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #1a1a1a; border-bottom: 2px solid #abd300; padding-bottom: 10px;">
                New Contact Form Submission
              </h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555; width: 120px;">Name:</td>
                  <td style="padding: 8px 0; color: #1a1a1a;">${escapeHtml(name.trim())}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555;">Email:</td>
                  <td style="padding: 8px 0; color: #1a1a1a;">${escapeHtml(email.trim())}</td>
                </tr>
                ${phone?.trim() ? `<tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555;">Phone:</td>
                  <td style="padding: 8px 0; color: #1a1a1a;">${escapeHtml(phone.trim())}</td>
                </tr>` : ""}
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555;">Type:</td>
                  <td style="padding: 8px 0; color: #1a1a1a;">${escapeHtml(type || "General")}</td>
                </tr>
              </table>
              <div style="margin-top: 20px; padding: 15px; background: #f8f8f6; border-radius: 8px;">
                <p style="font-weight: bold; color: #555; margin: 0 0 8px 0;">Message:</p>
                <p style="color: #1a1a1a; margin: 0; white-space: pre-wrap;">${escapeHtml(message.trim())}</p>
              </div>
              <p style="margin-top: 20px; font-size: 12px; color: #999;">
                You can reply directly to this email to respond to ${escapeHtml(name.trim())}.
              </p>
            </div>
          `,
        });
        if (sendError) console.error("Contact email notification error:", sendError);
      } catch (emailErr) {
        // Log but don't fail the submission — the data is saved in Supabase
        console.error("Email notification error:", emailErr);
      }
    }

    return { success: true };
  } catch (err) {
    console.error("Contact form submission error:", err);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
