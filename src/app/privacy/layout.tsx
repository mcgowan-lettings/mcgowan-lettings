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
  },
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
