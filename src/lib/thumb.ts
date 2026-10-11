/**
 * Listing-card thumbnails. Every property photo at
 *   …/property-images/properties/<name>
 * has a ~640px JPEG twin at
 *   …/property-images/properties/thumbs/<name-without-ext>.jpg
 * written by the admin editors at upload time (and backfilled once for older
 * photos). Cards and small previews use the thumb; the gallery and lightbox
 * use the original. No server-side transforms: see CLAUDE.md "Images".
 */
export const THUMB_PREFIX = "properties/thumbs";
export const THUMB_MAX_PX = 640;
export const THUMB_QUALITY = 0.72;

const MARKER = "/property-images/properties/";

/** Thumbnail URL for a property photo URL; other URLs (Unsplash, videos,
 * already-a-thumb) are returned unchanged. */
export function thumbUrl(url: string): string {
  const i = url.indexOf(MARKER);
  if (i === -1) return url;
  const rest = url.slice(i + MARKER.length).split(/[?#]/)[0];
  if (rest.includes("/")) return url; // videos/, thumbs/ — not a photo
  const base = rest.replace(/\.[^.]*$/, "");
  return `${url.slice(0, i)}/property-images/${THUMB_PREFIX}/${base}.jpg`;
}

/** Storage path (inside the bucket) of a photo's thumbnail, or null. */
export function thumbPathForPhotoPath(photoPath: string): string | null {
  if (!photoPath.startsWith("properties/")) return null;
  const rest = photoPath.slice("properties/".length);
  if (rest.includes("/")) return null;
  return `${THUMB_PREFIX}/${rest.replace(/\.[^.]*$/, "")}.jpg`;
}
