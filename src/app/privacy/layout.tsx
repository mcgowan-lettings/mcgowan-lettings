import type { Metadata } from "next";

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
    url: "https://mcgowanlettings.co.uk/privacy",
  },
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
