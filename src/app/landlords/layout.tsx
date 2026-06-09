import type { Metadata } from "next";

const title = "Landlord Services | McGowan Residential Lettings";
const description =
  "Fully managed and let-only services for landlords across Greater Manchester. No let, no fee. No hidden charges. Over 25 years of experience in Bury, Bolton, Manchester and Rossendale.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/landlords" },
  openGraph: {
    title,
    description,
    images: [{ url: "/hero.jpg", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/hero.jpg"],
  },
};

export default function LandlordsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
