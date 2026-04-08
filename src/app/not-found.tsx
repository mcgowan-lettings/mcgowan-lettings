import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
  return (
    <>
      <section className="relative min-h-[80vh] flex items-center overflow-hidden noise-overlay bg-dark pt-16">
        <div className="absolute inset-0">
          <Image
            src="/hero.jpg"
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
            Page Not Found
          </p>
          <h1 className="font-heading text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-semibold text-white leading-[1.1] mb-6">
            404
          </h1>
          <p className="text-white/70 text-lg md:text-xl max-w-md mx-auto mb-10">
            Sorry, the page you are looking for does not exist or has been moved.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-brand text-dark font-semibold px-8 py-3.5 rounded-sm hover:bg-brand-light transition-colors"
          >
            Back to Homepage
          </Link>
        </div>
      </section>
    </>
  );
}
