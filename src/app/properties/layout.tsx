import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Properties to Rent | McGowan Residential Lettings",
  description:
    "Browse rental properties across Greater Manchester including Bury, Bolton, Manchester, Rossendale and Accrington. Houses, apartments and flats available from McGowan Residential Lettings.",
  alternates: { canonical: "/properties" },
};

export default function PropertiesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
