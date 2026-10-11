import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";

const title = "Privacy Policy | McGowan Residential Lettings";
const description =
  "Privacy Policy for McGowan Residential Lettings Ltd. Learn how we collect, use, and protect your personal data in accordance with GDPR.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/privacy" },
  openGraph: {
    title,
    description,
    url: `${SITE_URL}/privacy`,
    // Next replaces (doesn't merge) a parent's openGraph object, so restate
    // the root defaults here or shares lose the image/site name.
    siteName: "McGowan Residential Lettings",
    type: "website",
    images: [{ url: "/hero.jpg", width: 1920, height: 1280, alt: "McGowan Residential Lettings — Greater Manchester" }],
  },
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
