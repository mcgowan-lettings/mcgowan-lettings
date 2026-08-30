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
