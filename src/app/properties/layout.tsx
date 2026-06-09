import type { Metadata } from "next";

const title = "Properties to Rent | McGowan Residential Lettings";
const description =
  "Browse rental properties across Greater Manchester including Bury, Bolton, Manchester, Rochdale and Rossendale. Houses, apartments and flats available from McGowan Residential Lettings.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/properties" },
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

export default function PropertiesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
