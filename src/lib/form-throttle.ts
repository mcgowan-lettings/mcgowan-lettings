import { supabaseAdmin } from "@/lib/supabase-server";
import { getResend } from "@/lib/resend";
import { SITE_URL } from "@/lib/site";

/** Per-sender cap for the public lead forms (contact, valuation). A real
 * person never sends more than a handful in an hour; a script calling the
 * server action directly (action IDs are public) would. */
const MAX_PER_EMAIL_PER_HOUR = 5;

/** Per-IP cap: rotating fake email addresses is free, IPs aren't. */
const MAX_PER_IP_PER_HOUR = 5;

/** Above this many rows in the last hour across a table, leads are still
 * saved but per-lead notification emails are skipped — a flood can't burn
 * the Resend quota or bury David's inbox. The submission that trips the
 * breaker sends one "notifications paused" email instead, so real leads
 * arriving during a flood aren't silently missed (they're in the admin inbox). */
// Raised from 30 now that each IP is capped at 5/hour: tripping it takes a
// distributed flood, not one script.
const EMAIL_CIRCUIT_BREAKER_PER_HOUR = 60;

function escapeLike(s: string): string {
  return s.replace(/[\\%_]/g, (c) => `\\${c}`);
}

/**
 * Returns whether this submission may be saved and whether to send the
 * notification email. Fails open on query errors — losing a genuine lead is
 * worse than letting one extra spam row through.
 */
export async function checkLeadThrottle(
  table: "contact_submissions" | "valuation_requests",
  email: string,
  ip: string | null
): Promise<{ allowed: boolean; sendEmail: boolean; sendPausedNotice: boolean }> {
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  try {
    const [byEmail, total, byIp] = await Promise.all([
      supabaseAdmin
        .from(table)
        .select("id", { count: "exact", head: true })
        .ilike("email", escapeLike(email))
        .gte("created_at", hourAgo),
      supabaseAdmin
        .from(table)
        .select("id", { count: "exact", head: true })
        .gte("created_at", hourAgo),
      ip
        ? supabaseAdmin
            .from(table)
            .select("id", { count: "exact", head: true })
            .eq("ip_address", ip)
            .gte("created_at", hourAgo)
        : Promise.resolve({ count: 0, error: null }),
    ]);
    const queryError = byEmail.error ?? total.error ?? byIp.error;
    if (queryError) {
      console.error(`${table} throttle check error:`, queryError);
      return { allowed: true, sendEmail: true, sendPausedNotice: false };
    }
    const recent = total.count ?? 0;
    return {
      allowed:
        (byEmail.count ?? 0) < MAX_PER_EMAIL_PER_HOUR &&
        (byIp.count ?? 0) < MAX_PER_IP_PER_HOUR,
      sendEmail: recent < EMAIL_CIRCUIT_BREAKER_PER_HOUR,
      sendPausedNotice: recent === EMAIL_CIRCUIT_BREAKER_PER_HOUR,
    };
  } catch (err) {
    console.error(`${table} throttle check error:`, err);
    return { allowed: true, sendEmail: true, sendPausedNotice: false };
  }
}

/** Email subjects are plain text: strip CR/LF rather than HTML-escaping. */
export function plainSubject(s: string): string {
  return s.replace(/[\r\n]+/g, " ");
}

/** One-off alert sent when the circuit breaker trips (see above). */
export async function sendPausedNotice(kind: "contact" | "valuation"): Promise<void> {
  const where = kind === "contact" ? "Submissions" : "Valuations";
  try {
    const { error } = await getResend().emails.send({
      from: "McGowan Lettings <notifications@mcgowanlettings.co.uk>",
      to: "info@mcgowanlettings.co.uk",
      subject: `Unusually many ${kind} form messages — email alerts paused`,
      html: `<p>The website has received ${EMAIL_CIRCUIT_BREAKER_PER_HOUR}+ ${kind} form messages in the last hour, which usually means a spam bot.</p>
<p>To avoid flooding your inbox, email alerts for this form are paused until things calm down. <strong>Every message is still saved</strong> — check <a href="${SITE_URL}/admin">Admin → ${where}</a> for any genuine enquiries.</p>`,
    });
    if (error) console.error("Paused-notice email error:", error);
  } catch (err) {
    console.error("Paused-notice email error:", err);
  }
}

/** Client IP from Vercel's x-forwarded-for (first hop), or null. */
export async function clientIp(): Promise<string | null> {
  try {
    const { headers } = await import("next/headers");
    const fwd = (await headers()).get("x-forwarded-for");
    return fwd ? fwd.split(",")[0].trim().slice(0, 100) || null : null;
  } catch {
    return null;
  }
}

/**
 * True if the same sender already submitted the same content in the last 10
 * minutes — e.g. mobile signal dropped after the server saved and emailed,
 * the visitor saw "network error" and pressed Send again. Treated as success
 * without a second row or email. Fails open (false) on query errors.
 */
export async function isRecentDuplicate(
  table: "contact_submissions" | "valuation_requests",
  email: string,
  column: "message" | "address",
  value: string
): Promise<boolean> {
  const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  try {
    const { count, error } = await supabaseAdmin
      .from(table)
      .select("id", { count: "exact", head: true })
      .ilike("email", escapeLike(email))
      .eq(column, value)
      .gte("created_at", since);
    if (error) return false;
    return (count ?? 0) > 0;
  } catch {
    return false;
  }
}
