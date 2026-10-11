import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Next 16.3 writes an AGENTS.md into the repo on every dev start; this
  // project documents itself in CLAUDE.md, so keep the tree clean.
  agentRules: false,
  images: {
    // `unoptimized` = every <Image> renders a plain `src` of the original file
    // (no srcset, no /_next/image, no transform URL). All uploads are already
    // compressed in the browser (≤1600px / q0.75, see src/lib/compress-image.ts),
    // so server-side resizing buys almost nothing — and both resizing options
    // cost money: Vercel's optimizer quota once 402'd the whole site, and
    // Supabase's transform endpoint only includes 100 origin images/month on
    // Pro. A single URL per image also means the browser downloads each photo
    // once, however many sizes it's shown at (card, gallery, lightbox).
    // Don't reintroduce a loader / transform endpoint without revisiting this.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
  async headers() {
    // Static brand assets: a day fresh + a week of SWR rather than "immutable",
    // because these keep their filenames when replaced (hero.jpg was swapped
    // in place) and a year-long cache would pin the old file on devices.
    const brandAssetCache = [
      { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
    ];
    return [
      {
        // Baseline security headers. No CSP beyond frame-ancestors: a full
        // policy would need careful allow-listing for Plyr, Fancybox, Vercel
        // Analytics/Speed Insights and the Google Maps iframes.
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
        ],
      },
      { source: "/hero.jpg", headers: brandAssetCache },
      { source: "/hero-mobile.jpg", headers: brandAssetCache },
      { source: "/hero-desktop.jpg", headers: brandAssetCache },
      { source: "/hero-banner.jpg", headers: brandAssetCache },
      { source: "/mcgowan-logo.png", headers: brandAssetCache },
      { source: "/mcgowan-logo-header.png", headers: brandAssetCache },
      { source: "/logos/:path*", headers: brandAssetCache },
      { source: "/certificates/:path*", headers: brandAssetCache },
      {
        source: "/admin/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
      {
        source: "/admin",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
      {
        source: "/apply",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
      {
        source: "/guarantor",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // Old WordPress pages still linked from bookmarks, directories and the
      // search index (the trailing-slash 308 runs first, then these).
      { source: "/current-properties", destination: "/properties", permanent: true },
      { source: "/advanced-search", destination: "/properties", permanent: true },
      { source: "/favourites", destination: "/properties", permanent: true },
      { source: "/contact-us", destination: "/contact", permanent: true },
      { source: "/feed", destination: "/blog", permanent: true },
      // Old borough pages → the matching area guide. One rule per borough
      // with a literal lowercase destination: path matching is
      // case-insensitive, and /areas/[slug] only serves lowercase slugs, so
      // "/property_city/Bury" must still land on "/areas/bury".
      ...["bury", "bolton", "manchester", "rossendale", "rochdale", "accrington", "burnley"].map((slug) => ({
        source: `/property_city/${slug}`,
        destination: `/areas/${slug}`,
        permanent: true,
      })),
      { source: "/property_city/:path*", destination: "/areas", permanent: true },
      {
        // Legacy WordPress property slugs (text-based, e.g. "/properties/cosy-flat-bury").
        // The `[g-z]` guard requires at least one letter g-z, which excludes our
        // new UUID-style IDs (hex 0-9a-f only) so live property URLs aren't caught.
        source: "/properties/:slug([a-z0-9-]*[g-z][a-z0-9-]*)",
        destination: "/properties",
        permanent: true,
      },
      {
        source: "/property_category/:path*",
        destination: "/properties",
        permanent: true,
      },
      {
        source: "/property_action_category/:path*",
        destination: "/properties",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
