/**
 * Custom Next.js image loader.
 *
 * Replaces Vercel's image optimizer (which sat behind a Hobby-tier monthly
 * quota and 402'd the entire site once exhausted) with Supabase's image
 * transformation endpoint — included free with the Pro plan David already
 * pays for, and CDN-cached by Cloudflare in front.
 *
 * Routing:
 *   • Supabase Storage URL + requested width ≥ source cap → original object
 *     URL, served verbatim. Re-encoding a 1600 px source at "give me 3840"
 *     just adds a lossy JPEG pass over already-compressed bytes; better to
 *     hand the browser the same bytes it would have got under Vercel (which
 *     also never upscaled). This is what makes the resized output indistinguishable
 *     from the pre-incident look.
 *   • Supabase Storage URL + smaller width → /storage/v1/render/image/public/…
 *     with ?width=N&resize=contain&quality=N (tested empirically: this is the
 *     only param combo that aspect-preserves a width-only resize).
 *   • Anything else (local /public assets, external Unsplash) → served verbatim.
 *
 * Next.js calls this once per (src, width) pair when building srcset, so a
 * single image fans out to ~6-8 URLs spanning deviceSizes/imageSizes. Supabase
 * bills per *origin* image, not per variant, so cardinality is free.
 */

const SUPABASE_PUBLIC_OBJECT = /^(https:\/\/[^/]+\.supabase\.co)\/storage\/v1\/object\/public\/(.+)$/;

/**
 * Hard cap on uploaded image width — see `MAX_WIDTH` in src/lib/compress-image.ts.
 * Every property photo is resized to this in the browser before upload, so any
 * srcset variant the browser picks at this width or above is served as the
 * original file with no transformation pass. Keep these two numbers in sync.
 */
const SOURCE_MAX_WIDTH = 1600;

type LoaderArgs = {
  src: string;
  width: number;
  quality?: number;
};

export default function imageLoader({ src, width, quality }: LoaderArgs): string {
  const match = src.match(SUPABASE_PUBLIC_OBJECT);
  if (!match) {
    // Local /public files, external URLs — pass through unchanged.
    return src;
  }

  // Variants at or above the source cap: serve the original. Supabase's render
  // endpoint won't upscale anyway, and skipping it avoids the extra lossy pass.
  if (width >= SOURCE_MAX_WIDTH) {
    return src;
  }

  const [, origin, path] = match;
  const params = new URLSearchParams({
    width: String(width),
    resize: "contain",
    quality: String(quality ?? 85),
  });
  return `${origin}/storage/v1/render/image/public/${path}?${params.toString()}`;
}
