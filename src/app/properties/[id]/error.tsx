"use client";

import Link from "next/link";

// Next 16.3: `retry()` re-fetches the segment's server data and re-renders
// (recommended); `reset()` only re-renders the cached, already-failed payload.
export default function PropertyError({ retry }: { retry: () => void }) {
  return (
    <section className="bg-cream pt-16 min-h-[70vh] flex items-center">
      <div className="max-w-xl mx-auto px-6 text-center py-24">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-7 h-7 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
        </div>
        <h1 className="font-heading text-3xl font-semibold text-dark mb-3">
          Something went wrong
        </h1>
        <p className="text-text-muted leading-relaxed mb-8">
          We couldn&rsquo;t load this property. Please try again or browse our
          current listings.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => retry()}
            className="inline-flex items-center gap-2 bg-brand text-dark font-semibold text-sm px-8 py-3 rounded-md hover:bg-brand-light transition-colors"
          >
            Try again
          </button>
          <Link
            href="/properties"
            className="inline-flex items-center gap-2 border border-dark/15 text-dark font-semibold text-sm px-8 py-3 rounded-md hover:bg-gray-50 transition-colors"
          >
            View All Properties
          </Link>
        </div>
      </div>
    </section>
  );
}
