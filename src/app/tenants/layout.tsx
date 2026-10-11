import type { Metadata } from "next";

const title = "Tenant Information | McGowan Residential Lettings";
const description =
  "Everything you need to know about renting with McGowan Residential Lettings. Move-in costs, responsibilities, FAQs and fees for tenants across Greater Manchester.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/tenants" },
  openGraph: {
    title,
    description,
    url: "/tenants",
    siteName: "McGowan Residential Lettings",
    images: [{ url: "/hero.jpg", width: 2880, height: 1920, alt: "McGowan Residential Lettings — Greater Manchester" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/hero.jpg"],
  },
};

export default function TenantsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
