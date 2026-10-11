import type { Metadata } from "next";
import ApplicationPage from "@/components/ApplicationPage";
import { copyFor } from "@/lib/application-copy";
import { firstParam } from "@/lib/search-param";

/*
 * /apply — tenant application form.
 * Private link David sends to prospective tenants; deliberately noindex and
 * absent from the sitemap/nav. Optional `?property=...&rent=...` prefill.
 * The guarantor twin lives at /guarantor.
 */

const copy = copyFor("tenant");

export const metadata: Metadata = {
  title: copy.metaTitle,
  description: copy.metaDescription,
  // Own canonical (otherwise the root layout's "/" is inherited). Stays
  // noindex: robots.txt also disallows it, so this header/meta is the
  // backstop for anyone who links to it.
  alternates: { canonical: "/apply" },
  robots: { index: false, follow: false },
};

type SearchParams = Record<string, string | string[] | undefined>;

export default async function ApplyPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  return (
    <ApplicationPage
      kind="tenant"
      initialProperty={firstParam(params.property).slice(0, 200)}
      initialRent={firstParam(params.rent).slice(0, 20)}
    />
  );
}
