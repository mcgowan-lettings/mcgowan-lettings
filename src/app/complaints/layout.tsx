import type { Metadata } from "next";

const title = "Complaints Procedure | McGowan Residential Lettings";
const description =
  "Our complaints procedure. Learn how to raise a complaint with McGowan Residential Lettings and how we handle the resolution process.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/complaints" },
  openGraph: {
    title,
    description,
    url: "https://mcgowanlettings.co.uk/complaints",
  },
};

export default function ComplaintsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
