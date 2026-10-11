import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
    return [
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
