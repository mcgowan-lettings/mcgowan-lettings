"use server";

import { isAuthApiError, isAuthRetryableFetchError } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";

/**
 * Tri-state admin check for the client-side admin layout gate.
 *
 * - "admin"        — token valid and email on the ADMIN_EMAILS allowlist
 * - "forbidden"    — token valid but not an admin (definite: sign out)
 * - "unauthorized" — token missing/invalid/expired (definite: sign out)
 * - "error"        — transient failure (network, Supabase 5xx). The caller
 *                    must NOT sign the user out — that would throw away
 *                    unsaved work over a hiccup.
 *
 * `requireAdmin` collapses "Supabase unreachable" into "Unauthorized", so on
 * that path we re-probe `getUser` to tell a genuinely bad token apart from a
 * transient failure. Read-only: performs no mutation.
 */
export async function getAdminSessionStatus(
  accessToken: string
): Promise<"admin" | "forbidden" | "unauthorized" | "error"> {
  if (!accessToken) return "unauthorized";
  try {
    await requireAdmin(accessToken);
    return "admin";
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message === "Forbidden") return "forbidden";
    if (message !== "Unauthorized") return "error";
  }

  try {
    const { data, error } = await supabaseAdmin.auth.getUser(accessToken);
    if (!error && data.user) {
      // Token is fine now — the earlier failure was transient.
      return "error";
    }
    if (
      isAuthRetryableFetchError(error) ||
      (isAuthApiError(error) && (error.status ?? 0) >= 500)
    ) {
      return "error";
    }
    return "unauthorized";
  } catch {
    return "error";
  }
}
