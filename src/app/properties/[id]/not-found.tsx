import type { Metadata } from "next";
import Link from "next/link";

// Used for the <head> when getProperty() finds nothing and the page calls
// notFound(). Without this the 404 inherits canonical=/properties from
// properties/layout.tsx and robots "index, follow" from the root layout,
// contradicting the automatic <meta name="robots" content="noindex"> Next adds
// for 404s. `robots: null` leaves that automatic tag as the only one.
export const metadata: Metadata = {
  title: "Property Not Found | McGowan Residential Lettings",
  description: "This property is no longer available. Browse our current rental listings.",
  robots: null,
  alternates: { canonical: null },
  openGraph: null,
  twitter: null,
};

export default function PropertyNotFound() {
  return (
    <section className="bg-cream pt-16 min-h-[70vh] flex items-center">
      <div className="max-w-xl mx-auto px-6 text-center py-24">
        <div className="w-16 h-16 rounded-full bg-warm-grey flex items-center justify-center mx-auto mb-6">
          <svg className="w-7 h-7 text-text-light" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
        </div>
        <h1 className="font-heading text-3xl font-semibold text-dark mb-3">
          Property Not Found
        </h1>
        <p className="text-text-muted leading-relaxed mb-8">
          This property may no longer be available or the link may be incorrect.
          Browse our current listings to find your next home.
        </p>
        <Link
          href="/properties"
          className="inline-flex items-center gap-2 bg-brand text-dark font-semibold text-sm px-8 py-3 rounded-md hover:bg-brand-dark transition-colors"
        >
          <svg className="w-4 h-4 rotate-180" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
          View All Properties
        </Link>
      </div>
    </section>
  );
}
