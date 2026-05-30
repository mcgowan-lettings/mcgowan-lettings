import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Custom loader is a pure pass-through (no server-side resizing) — it
    // serves every image's already-compressed original (≤1600px/q0.75) and
    // appends a per-width marker so Next's srcset stays valid. This sidesteps
    // BOTH Vercel's image-optimization quota AND Supabase's 100-origin-image/mo
    // transform quota. See src/lib/image-loader.ts for the full rationale.
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    qualities: [75, 80, 85, 90],
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
