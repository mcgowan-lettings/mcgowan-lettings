"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

// App-level error boundary (renders inside the root layout, so the header and
// footer stay). Styled to match not-found.tsx. `retry()` (Next 16.3) re-fetches
// the failed segment's server data before re-rendering, unlike `reset()`.
export default function AppError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="relative min-h-[80vh] flex items-center overflow-hidden noise-overlay bg-dark focus-on-dark pt-24 pb-12">
      <div className="absolute inset-0">
        <Image
          src="/hero-banner.jpg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-center opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark/90 via-dark/60 to-dark/70" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 text-center w-full">
        <p className="text-brand text-sm font-semibold tracking-[0.15em] uppercase mb-4">
          Something went wrong
        </p>
        <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-semibold text-white leading-[1.1] mb-6">
          Sorry, this page didn&rsquo;t load
        </h1>
        <p className="text-white/70 text-lg md:text-xl max-w-md mx-auto mb-10">
          It&rsquo;s probably a temporary hiccup. Please try again, or head back
          to the homepage.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => retry()}
            className="inline-flex items-center justify-center gap-2 min-h-11 bg-brand text-dark font-semibold px-8 py-3.5 rounded-sm hover:bg-brand-light transition-colors"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 min-h-11 border border-white/30 text-white font-semibold px-8 py-3.5 rounded-sm hover:bg-white/10 transition-colors"
          >
            Back to Homepage
          </Link>
        </div>
      </div>
    </section>
  );
}
