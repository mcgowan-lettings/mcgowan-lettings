import type { Metadata } from "next";

const title = "Contact Us | McGowan Residential Lettings";
const description =
  "Get in touch with McGowan Residential Lettings. Call, WhatsApp, or email David directly. Letting agents in Bury, Bolton, Manchester and Rossendale with over 25 years of experience.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/contact" },
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

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
