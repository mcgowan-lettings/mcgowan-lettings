import { Metadata } from "next";

const title = "Free Property Valuation | McGowan Residential Lettings";
const description =
  "Get a free, no-obligation rental valuation for your property in Greater Manchester. Find out what your property could earn.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/valuation" },
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

export default function ValuationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
