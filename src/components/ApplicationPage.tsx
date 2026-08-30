import ApplyForm from "@/app/apply/ApplyForm";
import { copyFor } from "@/lib/application-copy";
import type { ApplicationKind } from "@/lib/application-types";

/**
 * Shared page shell for the two application forms — /apply (tenant) and
 * /guarantor. Same layout, wording comes from `application-copy`.
 */
export default function ApplicationPage({
  kind,
  initialProperty = "",
  initialRent = "",
  initialTenant = "",
}: {
  kind: ApplicationKind;
  initialProperty?: string;
  initialRent?: string;
  initialTenant?: string;
}) {
  const copy = copyFor(kind);

  return (
    <>
      {/* ── Page header (no hero — keeps the form above the fold on phones) ── */}
      <section className="bg-dark noise-overlay pt-16">
        <div className="max-w-3xl mx-auto px-6 py-12 md:py-16 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-px bg-brand" />
            <span className="text-brand text-sm font-semibold tracking-[0.15em] uppercase">
              {copy.heroKicker}
            </span>
            <div className="w-8 h-px bg-brand" />
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-semibold text-white leading-[1.1] mb-4">
            {copy.heroTitle}
          </h1>
          <p className="text-white/70 text-base md:text-lg max-w-xl mx-auto">
            {copy.heroIntro}
          </p>
        </div>
      </section>

      <section className="bg-cream py-10 md:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <ApplyForm
            kind={kind}
            initialProperty={initialProperty}
            initialRent={initialRent}
            initialTenant={initialTenant}
          />
        </div>
      </section>
    </>
  );
}
