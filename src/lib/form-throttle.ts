import { supabaseAdmin } from "@/lib/supabase-server";
import { getResend } from "@/lib/resend";
import { SITE_URL } from "@/lib/site";

/** Per-sender cap for the public lead forms (contact, valuation). A real
 * person never sends more than a handful in an hour; a script calling the
 * server action directly (action IDs are public) would. Plus-address
 * variants (a+1@x, a+2@x) count as the same sender. */
const MAX_PER_EMAIL_PER_HOUR = 5;

/** Per-IP cap: rotating fake email addresses is free, IPs aren't. */
const MAX_PER_IP_PER_HOUR = 5;

/** Above this many rows in the last hour across a table, leads are still
 * saved but per-lead notification emails are skipped — a flood can't burn
 * the Resend quota or bury David's inbox. One "alerts paused" email per hour
 * goes out instead, so real leads during a flood aren't silently missed
 * (they're all in the admin inbox). Each IP is capped at 5/hour, so tripping
 * it takes a distributed flood, not one script. */
const EMAIL_CIRCUIT_BREAKER_PER_HOUR = 60;

type LeadTable = "contact_submissions" | "valuation_requests";

/** Escape LIKE wildcards so an email is matched literally by ilike. (PostgREST
 * also treats `*` as a wildcard; emails containing `*` are rejected up front
 * by isSafeLeadEmail.) */
function escapeLike(s: string): string {
  return s.replace(/[\\%_]/g, (c) => `\\${c}`);
}

/** Emails with LIKE/PostgREST wildcard characters are rejected: they're never
 * real-world addresses, and `*@*.*` would otherwise match everyone's rows. */
export function isSafeLeadEmail(email: string): boolean {
  return !/[*%]/.test(email);
}

function emailPatterns(email: string): [string, string] {
  const at = email.lastIndexOf("@");
  const local = email.slice(0, at).split("+")[0];
  const domain = email.slice(at + 1);
  return [`${escapeLike(local)}@${escapeLike(domain)}`, `${escapeLike(local)}+%@${escapeLike(domain)}`];
}

/**
 * Throttle verdict for a lead submission. Call it twice: once before the
 * insert (`includesSelf: false`) as a cheap early reject, and again AFTER the
 * insert (`includesSelf: true`). Check-then-insert alone races — 100
 * concurrent calls all see 0 rows and all pass — but the post-insert count
 * includes this row and every concurrent one, and rows that passed are never
 * removed, so at most the cap ever gets through. The caller deletes its own
 * row when the post-insert verdict says it's over.
 *
 * Fails open on query errors — losing a genuine lead is worse than letting
 * one extra spam row through.
 */
export async function checkLeadThrottle(
  table: LeadTable,
  email: string,
  ip: string | null,
  includesSelf: boolean
): Promise<{ allowed: boolean; sendEmail: boolean }> {
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const slack = includesSelf ? 0 : 1;
  const count = (q: PromiseLike<{ count: number | null; error: unknown }>) => q;
  try {
    const [exact, plus] = emailPatterns(email);
    const base = () => supabaseAdmin.from(table).select("id", { count: "exact", head: true }).gte("created_at", hourAgo);
    const [byEmail, byPlusEmail, total, byIp] = await Promise.all([
      count(base().ilike("email", exact)),
      count(base().ilike("email", plus)),
      count(base()),
      ip ? count(base().eq("ip_address", ip)) : Promise.resolve({ count: 0, error: null }),
    ]);
    const queryError = byEmail.error ?? byPlusEmail.error ?? total.error ?? byIp.error;
    if (queryError) {
      console.error(`${table} throttle check error:`, queryError);
      return { allowed: true, sendEmail: true };
    }
    const emailCount = (byEmail.count ?? 0) + (byPlusEmail.count ?? 0);
    return {
      allowed: emailCount + slack <= MAX_PER_EMAIL_PER_HOUR && (byIp.count ?? 0) + slack <= MAX_PER_IP_PER_HOUR,
      sendEmail: (total.count ?? 0) + slack <= EMAIL_CIRCUIT_BREAKER_PER_HOUR,
    };
  } catch (err) {
    console.error(`${table} throttle check error:`, err);
    return { allowed: true, sendEmail: true };
  }
}

/**
 * Atomically claim a once-per-hour latch (stored in site_config). Exactly one
 * concurrent caller per clock hour gets `true`, so a burst can't send several
 * "paused" emails — or none, as the old `count === 60` check could.
 */
async function claimHourlyLatch(key: string): Promise<boolean> {
  const hour = new Date().toISOString().slice(0, 13);
  try {
    await supabaseAdmin
      .from("site_config")
      .upsert({ key, value: "", updated_at: new Date().toISOString() }, { onConflict: "key", ignoreDuplicates: true });
    const { data, error } = await supabaseAdmin
      .from("site_config")
      .update({ value: hour, updated_at: new Date().toISOString() })
      .eq("key", key)
      .neq("value", hour)
      .select("key");
    if (error) return false;
    return (data?.length ?? 0) > 0;
  } catch {
    return false;
  }
}

/** Email subjects are plain text: strip CR/LF rather than HTML-escaping. */
export function plainSubject(s: string): string {
  return s.replace(/[\r\n]+/g, " ");
}

/** "Alerts paused" email — at most once per hour per form (see breaker). */
export async function sendPausedNotice(kind: "contact" | "valuation" | "application"): Promise<void> {
  if (!(await claimHourlyLatch(`alerts_paused_${kind}`))) return;
  const where = kind === "contact" ? "Submissions" : kind === "valuation" ? "Valuations" : "Applications";
  try {
    const { error } = await getResend().emails.send({
      from: "McGowan Lettings <notifications@mcgowanlettings.co.uk>",
      to: "info@mcgowanlettings.co.uk",
      subject: `Unusually many ${kind} form submissions — email alerts paused`,
      html: `<p>The website has received an unusually high number of ${kind} form submissions in the last hour, which usually means a spam bot.</p>
<p>To avoid flooding your inbox, email alerts for this form are paused until things calm down. <strong>Every submission is still saved</strong> — check <a href="${SITE_URL}/admin">Admin → ${where}</a> for anything genuine.</p>`,
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
  table: LeadTable,
  email: string,
  fields: Record<string, string | null>
): Promise<boolean> {
  const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  try {
    // Every submitted field must match: a resend with a corrected phone
    // number or message is a new submission, not a duplicate.
    let q = supabaseAdmin
      .from(table)
      .select("id", { count: "exact", head: true })
      .ilike("email", escapeLike(email))
      .gte("created_at", since);
    for (const [col, val] of Object.entries(fields)) q = val === null ? q.is(col, null) : q.eq(col, val);
    const { count, error } = await q;
    if (error) return false;
    return (count ?? 0) > 0;
  } catch {
    return false;
  }
}

/** Rows in `table` created in the last hour (for the application breaker).
 * Fails open (0) on errors. */
export async function recentRowCount(table: "tenant_applications"): Promise<number> {
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  try {
    const { count, error } = await supabaseAdmin
      .from(table)
      .select("id", { count: "exact", head: true })
      .gte("created_at", hourAgo);
    return error ? 0 : count ?? 0;
  } catch {
    return 0;
  }
}
