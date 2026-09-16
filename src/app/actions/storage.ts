"use server";

import { supabaseAdmin } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth";
import { cleanupOrphans } from "@/lib/cleanup-orphans";

/**
 * Reap unreferenced files in `property-images`. Called on every admin page
 * mount by `useStorageUsage`. Gated so the service-role listing/removal is
 * never reachable without an admin session. Errors propagate: the hook
 * swallows them, so worst case is "no cleanup this turn", never a bad delete.
 */
export async function cleanupOrphanedStorage(accessToken: string): Promise<number> {
  await requireAdmin(accessToken);
  return cleanupOrphans(supabaseAdmin);
}
