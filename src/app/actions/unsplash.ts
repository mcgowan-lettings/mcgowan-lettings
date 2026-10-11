"use server";

import { requireAdmin } from "@/lib/auth";

/**
 * Unsplash API guidelines require hitting a photo's `links.download_location`
 * whenever a user selects (i.e. "downloads") it. Done server-side so the
 * access key never reaches the browser, and gated with requireAdmin like the
 * search route so it can't be used to burn David's quota.
 *
 * Best-effort: never throws. The picker fires this without awaiting, so a
 * failure here must not affect selecting the photo.
 */
export async function trackUnsplashDownload(
  downloadLocation: string,
  accessToken: string
): Promise<{ success: boolean }> {
  try {
    await requireAdmin(accessToken);

    const accessKey = process.env.UNSPLASH_ACCESS_KEY;
    if (!accessKey) return { success: false };

    // Only ever call Unsplash's own API with our key — never an arbitrary
    // client-supplied URL (SSRF / key leak).
    let url: URL;
    try {
      url = new URL(downloadLocation);
    } catch {
      return { success: false };
    }
    if (
      url.protocol !== "https:" ||
      url.hostname !== "api.unsplash.com" ||
      !/^\/photos\/[^/]+\/download\/?$/.test(url.pathname)
    ) {
      return { success: false };
    }

    const res = await fetch(url, {
      headers: { Authorization: `Client-ID ${accessKey}` },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    return { success: res.ok };
  } catch {
    return { success: false };
  }
}
