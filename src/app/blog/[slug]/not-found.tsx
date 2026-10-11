import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

// Next resolves a not-found boundary's own `metadata` on top of the layouts.
// Without this the 404 inherits the parent's canonical (/blog) and the root's
// `index, follow`, contradicting the `noindex` Next injects for 404s. Nulling
// both leaves a single robots tag (Next's noindex) and no canonical.
export const metadata: Metadata = {
  title: "Post Not Found | McGowan Residential Lettings",
  description: null,
  alternates: { canonical: null },
  robots: null,
  openGraph: null,
  twitter: null,
};

export default function BlogNotFound() {
  return (
    <>
      <section className="relative min-h-[80vh] flex items-center overflow-hidden noise-overlay bg-dark pt-16">
        <div className="absolute inset-0">
          <Image
            src="/hero-banner.jpg"
            alt="Greater Manchester"
            fill
            sizes="100vw"
            quality={85}
            className="object-cover object-center opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dark/90 via-dark/60 to-dark/70" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center w-full">
          <p className="text-brand text-sm font-semibold tracking-[0.15em] uppercase mb-4">
            Post Not Found
          </p>
          <h1 className="font-heading text-6xl md:text-7xl lg:text-8xl font-semibold text-white leading-[1.1] mb-6">
            404
          </h1>
          <p className="text-white/70 text-lg md:text-xl max-w-md mx-auto mb-10">
            Sorry, the blog post you are looking for does not exist or has been
            removed.
          </p>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 bg-brand text-dark font-semibold px-8 py-3.5 rounded-sm hover:bg-brand-light transition-colors"
          >
            Back to Blog
          </Link>
        </div>
      </section>
    </>
  );
}
