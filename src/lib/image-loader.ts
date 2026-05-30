/**
 * Custom Next.js image loader — pure pass-through, no server-side resizing.
 *
 * History / why this is a pass-through:
 *   1. We started on Vercel's image optimizer. It sat behind a Hobby-tier
 *      monthly quota and, once exhausted, 402'd the *entire site* (hard fail).
 *   2. We moved to Supabase's image-transformation endpoint to escape that.
 *      But Supabase's Pro plan only includes **100 origin images / month** for
 *      transformations (an "origin image" = one distinct source file resized at
 *      least once that month — variants are free, but each *new* photo counts).
 *      With ~18 properties × many photos + blog covers we blow past 100 every
 *      month. It doesn't break the site (over-quota Supabase keeps serving and
 *      just bills ~$5/1000 origin images), but it's a recurring charge for
 *      David with no real upside — see point 3.
 *   3. There IS no real upside, because every image is already compressed to
 *      ≤1600px / q0.75 JPEG in the browser before upload (see
 *      src/lib/compress-image.ts). A typical property photo is 150–400 KB. The
 *      transform endpoint was only ever producing slightly-smaller thumbnails;
 *      serving the already-small original instead costs a little bandwidth
 *      (Cloudflare-cached, well inside the 250 GB Pro egress allowance) and
 *      saves the transform quota entirely.
 *
 * So every URL — Supabase Storage, local /public files, external Unsplash — is
 * returned verbatim with a per-width marker (`?_w=N`) appended. Next.js calls
 * this once per (src, width) pair when building srcset and requires distinct
 * URLs per width; `_w` (underscore-prefixed so Unsplash ignores it and doesn't
 * re-crop) satisfies that contract without changing the bytes the browser
 * fetches. The browser still picks the right-sized srcset entry; we just hand
 * it the same compressed original at every width.
 */

type LoaderArgs = {
  src: string;
  width: number;
  quality?: number;
};

export default function imageLoader({ src, width }: LoaderArgs): string {
  // Pass every URL through untouched, with a per-width marker so Next's
  // srcset entries are distinct. No Supabase transform call = no transform
  // quota usage. See the file header for the full rationale.
  const separator = src.includes("?") ? "&" : "?";
  return `${src}${separator}_w=${width}`;
}
