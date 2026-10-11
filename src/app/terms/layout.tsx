import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";

const title = "Terms of Service | McGowan Residential Lettings";
const description =
  "Terms of Service for the McGowan Residential Lettings website. Read our terms governing the use of this website and our property listings.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/terms" },
  openGraph: {
    title,
    description,
    url: `${SITE_URL}/terms`,
    // Next replaces (doesn't merge) a parent's openGraph object, so restate
    // the root defaults here or shares lose the image/site name.
    siteName: "McGowan Residential Lettings",
    type: "website",
    images: [{ url: "/hero.jpg", width: 2880, height: 1920, alt: "McGowan Residential Lettings — Greater Manchester" }],
  },
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
