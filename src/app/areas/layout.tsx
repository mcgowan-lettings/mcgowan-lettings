import { Metadata } from "next";

const title = "Area Guides | McGowan Residential Lettings";
const description =
  "Local area guides for renting across Greater Manchester. Discover Bury, Bolton, Manchester, Rossendale, and more.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/areas" },
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

export default function AreasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
