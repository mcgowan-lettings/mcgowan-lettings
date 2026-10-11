/**
 * Shown when a server action throws (expired session, network drop, deploy
 * skew). Deliberately doesn't say "refresh" — that would throw away the
 * unsaved form, so signing in happens in a second tab instead.
 */
export const ACTION_THREW_MESSAGE =
  "Couldn't save — your session may have expired. Open the admin in a new tab, sign in there, then come back and press Save again.";

/** Shown when there is no Supabase session at all before calling an action. */
export const SESSION_EXPIRED_MESSAGE = "Session expired. Please sign in again.";

/**
 * Storage object path for a `property-images` public URL, or null. Strips any
 * query/hash and percent-decodes, so names with spaces etc. resolve correctly.
 */
export function storagePathFromUrl(url: string): string | null {
  const raw = url.split("/property-images/")[1];
  if (!raw) return null;
  const clean = raw.split(/[?#]/)[0];
  if (!clean) return null;
  try {
    return decodeURIComponent(clean);
  } catch {
    return clean;
  }
}

/**
 * A safe lowercase file extension for an upload. `name.split(".").pop()`
 * returns the whole filename when there is no dot, so anything that isn't a
 * short alphanumeric extension falls back to one derived from the MIME type.
 */
export function safeExtension(file: File, fallback: "jpg" | "mp4" | "pdf"): string {
  const parts = file.name.split(".");
  const candidate = parts.length > 1 ? (parts.pop() ?? "").toLowerCase() : "";
  if (/^[a-z0-9]{1,5}$/.test(candidate)) return candidate;
  const byMime: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "application/pdf": "pdf",
    "video/mp4": "mp4",
    "video/webm": "webm",
    "video/quicktime": "mov",
  };
  return byMime[file.type] ?? fallback;
}

/**
 * Like Promise.allSettled(items.map(fn)) but runs at most `limit` at a time,
 * so a 30-photo batch on an iPad doesn't decode every image at once.
 */
export async function mapSettledWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<PromiseSettledResult<R>[]> {
  const results: PromiseSettledResult<R>[] = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      try {
        results[i] = { status: "fulfilled", value: await fn(items[i]) };
      } catch (reason) {
        results[i] = { status: "rejected", reason };
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

/** Pages open longer than this re-check that this session's uploads still exist. */
export const STALE_UPLOAD_CHECK_MS = 20 * 60 * 60 * 1000;

/**
 * Returns the URLs whose public object is gone (cleanupOrphans reaps unsaved
 * uploads after 24h). Network errors are treated as "still there" so a flaky
 * connection never strips photos from the form.
 */
export async function findMissingUploads(urls: string[]): Promise<string[]> {
  const checks = await Promise.all(
    urls.map(async (url) => {
      try {
        const res = await fetch(url, { method: "HEAD", cache: "no-store" });
        // Supabase answers a missing public object with 404 (older versions 400).
        return res.status === 404 || res.status === 400 ? url : null;
      } catch {
        return null;
      }
    })
  );
  return checks.filter((u): u is string => u !== null);
}

/**
 * Strict integer parse for form fields — parseInt("1e3") is 1, Number() is
 * 1000, and "2.5" / "" / "abc" are rejected rather than silently truncated.
 */
export function parseWholeNumber(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const n = Number(trimmed);
  return Number.isInteger(n) && n >= 0 ? n : null;
}
