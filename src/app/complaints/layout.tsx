import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";

const title = "Complaints Procedure | McGowan Residential Lettings";
const description =
  "Our complaints procedure. Learn how to raise a complaint with McGowan Residential Lettings and how we handle the resolution process.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/complaints" },
  openGraph: {
    title,
    description,
    url: `${SITE_URL}/complaints`,
    // Next replaces (doesn't merge) a parent's openGraph object, so restate
    // the root defaults here or shares lose the image/site name.
    siteName: "McGowan Residential Lettings",
    type: "website",
    images: [{ url: "/hero.jpg", width: 2880, height: 1920, alt: "McGowan Residential Lettings — Greater Manchester" }],
  },
};

export default function ComplaintsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
