import { supabaseAdmin } from "@/lib/supabase-server";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

/**
 * Validate that an access token belongs to an admin user.
 *
 * Throws "Unauthorized" if the token is missing or invalid, "Forbidden" if
 * the user is authenticated but not in the ADMIN_EMAILS allowlist. Used by
 * `src/app/actions/admin.ts` for every admin server action and by the
 * Unsplash API route to gate access to David's Unsplash quota.
 */
export async function requireAdmin(accessToken: string) {
  if (!accessToken) throw new Error("Unauthorized");
  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(accessToken);
  if (error || !user) throw new Error("Unauthorized");
  if (
    ADMIN_EMAILS.length === 0 ||
    !ADMIN_EMAILS.includes(user.email?.toLowerCase() ?? "")
  ) {
    throw new Error("Forbidden");
  }
  return user;
}
