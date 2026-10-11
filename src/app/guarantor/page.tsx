import type { Metadata } from "next";
import ApplicationPage from "@/components/ApplicationPage";
import { copyFor } from "@/lib/application-copy";
import { firstParam } from "@/lib/search-param";

/*
 * /guarantor — the same form as /apply, worded for a guarantor and with a
 * guarantor declaration. Private link, noindex, not in the nav or sitemap.
 * Optional `?property=...&rent=...&tenant=...` prefill.
 */

const copy = copyFor("guarantor");

export const metadata: Metadata = {
  title: copy.metaTitle,
  description: copy.metaDescription,
  // Own canonical (otherwise the root layout's "/" is inherited). Stays
  // noindex: robots.txt also disallows it, so this header/meta is the
  // backstop for anyone who links to it.
  alternates: { canonical: "/guarantor" },
  // Next replaces the root openGraph wholesale, so without this a shared
  // link previews as the homepage (generic title, og:url = /).
  openGraph: {
    title: copy.metaTitle,
    description: copy.metaDescription,
    url: "/guarantor",
    siteName: "McGowan Residential Lettings",
    type: "website",
    images: [{ url: "/hero.jpg", width: 2880, height: 1920, alt: "McGowan Residential Lettings — Greater Manchester" }],
  },
  robots: { index: false, follow: false },
};

type SearchParams = Record<string, string | string[] | undefined>;

export default async function GuarantorPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  return (
    <ApplicationPage
      kind="guarantor"
      initialProperty={firstParam(params.property).slice(0, 200)}
      initialRent={firstParam(params.rent).slice(0, 20)}
      initialTenant={firstParam(params.tenant).slice(0, 200)}
    />
  );
}
