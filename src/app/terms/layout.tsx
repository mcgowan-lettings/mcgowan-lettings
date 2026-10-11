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
  },
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
