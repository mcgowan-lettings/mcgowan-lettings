import Image from "next/image";
import Link from "next/link";
import { AnimateIn } from "@/components/AnimateIn";
import { ArrowRightIcon, MapPinIcon } from "@/components/Icons";

/* ───────────────────────── AREA DATA ───────────────────────── */

const AREAS = [
  {
    name: "Bury",
    slug: "bury",
    tagline: "Our home patch — a thriving market town with strong community roots",
    neighbourhoods: 5,
    highlight: "Main area",
  },
  {
    name: "Bolton",
    slug: "bolton",
    tagline: "Great value rentals in one of Greater Manchester's largest towns",
    neighbourhoods: 5,
    highlight: null,
  },
  {
    name: "Manchester",
    slug: "manchester",
    tagline: "City-centre living and vibrant suburban neighbourhoods",
    neighbourhoods: 5,
    highlight: null,
  },
  {
    name: "Rossendale",
    slug: "rossendale",
    tagline: "Scenic valley living with growing commuter appeal",
    neighbourhoods: 4,
    highlight: null,
  },
  {
    name: "Accrington",
    slug: "accrington",
    tagline: "Affordable market town with strong regeneration investment",
    neighbourhoods: 4,
    highlight: null,
  },
  {
    name: "Burnley",
    slug: "burnley",
    tagline: "Historic mill town offering some of the best yields in the UK",
    neighbourhoods: 4,
    highlight: null,
  },
];

/* ───────────────────────── PAGE ───────────────────────── */

export default function AreasPage() {
  return (
    <>
      {/* ─── HERO ─── */}
      <section className="relative h-[40vh] min-h-[280px] flex items-center overflow-hidden noise-overlay bg-dark pt-16">
        <div className="absolute inset-0">
          <Image
            src="/hero.jpg"
            alt="Greater Manchester skyline"
            fill
            sizes="100vw"
            quality={85}
            className="object-cover object-center opacity-40"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dark/80 via-dark/40 to-dark/60" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center w-full">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-px bg-brand" />
            <span className="text-brand text-sm font-semibold tracking-[0.15em] uppercase">
              Local Knowledge
            </span>
            <div className="w-8 h-px bg-brand" />
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold text-white leading-[1.1] mb-4">
            Area Guides
          </h1>
          <p className="text-white/70 text-lg md:text-xl max-w-2xl mx-auto">
            With over 25 years in the industry, we know Greater Manchester inside
            out. Explore our local area guides to find the right neighbourhood
            for you.
          </p>
        </div>
      </section>

      {/* ─── AREA GRID ─── */}
      <section className="bg-cream py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6">
          <AnimateIn>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-px bg-brand" />
              <span className="text-brand text-sm font-semibold tracking-[0.15em] uppercase">
                Areas We Cover
              </span>
            </div>
            <h2 className="font-heading text-3xl md:text-4xl font-semibold text-dark mb-4">
              Choose an Area
            </h2>
            <p className="text-text-muted text-lg max-w-2xl mb-14">
              We cover all areas across Greater Manchester and beyond. Each
              guide includes neighbourhood breakdowns, transport links and
              what makes the area special.
            </p>
          </AnimateIn>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {AREAS.map((area, i) => (
              <AnimateIn key={area.slug} delay={i * 0.08}>
                <Link
                  href={`/areas/${area.slug}`}
                  className="group block bg-white rounded-lg border border-black/5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 relative overflow-hidden h-full"
                >
                  <div className="absolute top-0 left-0 h-[3px] w-0 bg-brand group-hover:w-full transition-all duration-500 ease-out" />
                  <div className="p-8">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-brand/10 rounded-lg flex items-center justify-center">
                        <MapPinIcon className="w-6 h-6 text-brand-dark" />
                      </div>
                      {area.highlight && (
                        <span className="text-[10px] font-semibold bg-brand/10 text-brand-dark px-2.5 py-1 rounded tracking-wider uppercase">
                          {area.highlight}
                        </span>
                      )}
                    </div>
                    <h3 className="font-heading text-2xl font-semibold text-dark mb-2 group-hover:text-brand-dark transition-colors">
                      {area.name}
                    </h3>
                    <p className="text-text-muted text-sm leading-relaxed mb-4">
                      {area.tagline}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-text-muted">
                        {area.neighbourhoods} key neighbourhoods
                      </span>
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-dark group-hover:gap-2 transition-all duration-200">
                        Explore guide
                        <ArrowRightIcon className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-16 md:py-24 bg-dark relative overflow-hidden noise-overlay">
        <div className="absolute inset-0 bg-gradient-to-br from-dark via-dark/95 to-brand/10" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
          <AnimateIn>
            <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-semibold text-white mb-6">
              Own a Property in These Areas?
            </h2>
            <p className="text-white/70 text-lg max-w-xl mx-auto mb-10">
              Get a free, no-obligation rental valuation from David. We will
              assess your property and advise on the best approach to maximise
              your rental income.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/valuation"
                className="inline-flex items-center gap-2 bg-brand text-dark font-semibold px-8 py-3.5 rounded-sm hover:bg-brand-light transition-colors"
              >
                Request a Free Valuation
                <ArrowRightIcon className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/properties"
                className="inline-flex items-center gap-2 border border-white/20 text-white font-semibold px-8 py-3.5 rounded-sm hover:bg-white/10 transition-colors"
              >
                View All Properties
                <ArrowRightIcon className="w-3.5 h-3.5" />
              </Link>
            </div>
          </AnimateIn>
        </div>
      </section>
    </>
  );
}
