import { supabase } from "@/lib/supabase";
import { compressImage, makeThumbnail } from "@/lib/compress-image";
import { thumbPathForPhotoPath } from "@/lib/thumb";

const BUCKET = "property-images";

/** Upload names are unique timestamps and never overwritten, so objects can be
 * cached for a year (Supabase's default is 1h). */
export const UPLOAD_CACHE_CONTROL = "31536000";

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
 * EPC certificates may be photos/scans: images go through compressImage like
 * property photos (a phone photo of an EPC is often 3–8MB); PDFs upload
 * unchanged. If compression fails (e.g. iPad memory pressure) the original
 * — already capped at 10MB by the caller — is uploaded instead.
 */
export async function prepareEpcFile(file: File): Promise<File> {
  if (file.type === "application/pdf") return file;
  try {
    return await compressImage(file);
  } catch {
    return file;
  }
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
  // Upper bound keeps values inside Postgres int4 (and catches a stray extra
  // digit) instead of surfacing a raw "out of range" database error.
  return Number.isInteger(n) && n >= 0 && n <= 1_000_000 ? n : null;
}

/**
 * Storage paths to delete for a `property-images` public URL: the object
 * itself plus, for a property photo, its listing-card thumbnail.
 */
export function storagePathsForUrl(url: string): string[] {
  const path = storagePathFromUrl(url);
  if (!path) return [];
  const thumb = thumbPathForPhotoPath(path);
  return thumb ? [path, thumb] : [path];
}

/**
 * Compress a property photo, upload it, and upload its JPEG thumbnail to
 * thumbPathForPhotoPath(). Listing cards rely on the thumb existing, so if
 * the thumbnail can't be made or uploaded the photo upload fails as a whole
 * (the original is deleted again). Returns the photo's public URL.
 */
export async function uploadPropertyPhoto(rawFile: File): Promise<string> {
  const file = await compressImage(rawFile);
  const fileExt = safeExtension(file, "jpg");
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
  const filePath = `properties/${fileName}`;
  const thumbPath = thumbPathForPhotoPath(filePath);
  if (!thumbPath) throw new Error(`Failed to upload ${rawFile.name}: bad storage path.`);

  // Make the thumbnail first: a decode failure then costs no upload at all.
  let thumb: File;
  try {
    thumb = await makeThumbnail(file);
  } catch (err) {
    const why = err instanceof Error ? err.message : "unknown error";
    throw new Error(`Failed to upload ${rawFile.name}: couldn't create its thumbnail (${why})`);
  }

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, file, { cacheControl: UPLOAD_CACHE_CONTROL });
  if (uploadError) {
    throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
  }

  let thumbError: string | null = null;
  try {
    const { error } = await supabase.storage.from(BUCKET).upload(thumbPath, thumb, {
      cacheControl: UPLOAD_CACHE_CONTROL,
      contentType: "image/jpeg",
      upsert: false,
    });
    if (error) thumbError = error.message;
  } catch (err) {
    thumbError = err instanceof Error ? err.message : "network error";
  }
  if (thumbError) {
    // Roll back the original so no photo is ever saved without its thumb.
    // If this delete also fails, cleanupOrphans reaps it after 24h.
    try {
      await supabase.storage.from(BUCKET).remove([filePath]);
    } catch {}
    throw new Error(`Failed to upload ${rawFile.name}: its thumbnail didn't upload (${thumbError}). Please try again.`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
  return publicUrl;
}
