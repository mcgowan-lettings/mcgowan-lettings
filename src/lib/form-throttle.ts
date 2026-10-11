import { supabaseAdmin } from "@/lib/supabase-server";
import { getResend } from "@/lib/resend";
import { SITE_URL } from "@/lib/site";

/** Per-sender cap for the public lead forms (contact, valuation). A real
 * person never sends more than a handful in an hour; a script calling the
 * server action directly (action IDs are public) would. */
const MAX_PER_EMAIL_PER_HOUR = 5;

/** Above this many rows in the last hour across a table, leads are still
 * saved but per-lead notification emails are skipped — a flood can't burn
 * the Resend quota or bury David's inbox. The submission that trips the
 * breaker sends one "notifications paused" email instead, so real leads
 * arriving during a flood aren't silently missed (they're in the admin inbox). */
const EMAIL_CIRCUIT_BREAKER_PER_HOUR = 30;

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
  email: string
): Promise<{ allowed: boolean; sendEmail: boolean; sendPausedNotice: boolean }> {
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  try {
    const [byEmail, total] = await Promise.all([
      supabaseAdmin
        .from(table)
        .select("id", { count: "exact", head: true })
        .ilike("email", escapeLike(email))
        .gte("created_at", hourAgo),
      supabaseAdmin
        .from(table)
        .select("id", { count: "exact", head: true })
        .gte("created_at", hourAgo),
    ]);
    if (byEmail.error || total.error) {
      console.error(`${table} throttle check error:`, byEmail.error ?? total.error);
      return { allowed: true, sendEmail: true, sendPausedNotice: false };
    }
    const recent = total.count ?? 0;
    return {
      allowed: (byEmail.count ?? 0) < MAX_PER_EMAIL_PER_HOUR,
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
