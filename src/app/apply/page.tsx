import type { Metadata } from "next";
import ApplyForm from "./ApplyForm";

/*
 * /apply — tenant application form.
 * Private link David sends to prospective tenants; deliberately noindex and
 * absent from the sitemap/nav. Optional `?property=...&rent=...` prefill.
 */

export const metadata: Metadata = {
  title: "Tenant Application Form | McGowan Lettings",
  description:
    "Complete and sign your tenancy application for McGowan Residential Lettings.",
  robots: { index: false, follow: false },
};

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function ApplyPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const initialProperty = first(params.property).slice(0, 200);
  const initialRent = first(params.rent).slice(0, 20);

  return (
    <>
      {/* ── Page header (no hero — keeps the form above the fold on phones) ── */}
      <section className="bg-dark noise-overlay pt-16">
        <div className="max-w-3xl mx-auto px-6 py-12 md:py-16 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-px bg-brand" />
            <span className="text-brand text-sm font-semibold tracking-[0.15em] uppercase">
              Tenants
            </span>
            <div className="w-8 h-px bg-brand" />
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-semibold text-white leading-[1.1] mb-4">
            Tenant Application Form
          </h1>
          <p className="text-white/70 text-base md:text-lg max-w-xl mx-auto">
            Takes around five minutes. Fill in your details, read the
            declaration and sign with your finger &mdash; we&rsquo;ll do the
            rest.
          </p>
        </div>
      </section>

      <section className="bg-cream py-10 md:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <ApplyForm initialProperty={initialProperty} initialRent={initialRent} />
        </div>
      </section>
    </>
  );
}
