import Image from "next/image";
import Link from "next/link";
import { AnimateIn } from "@/components/AnimateIn";
import LogoRow from "@/components/LogoRow";

export const revalidate = 3600;
import {
  ShieldIcon,
  KeyIcon,
  CheckIcon,
  ArrowRightIcon,
  PhoneIcon,
  BuildingIcon,
  HomeIcon,
  UserGroupIcon,
  CurrencyIcon,
  ClockIcon,
} from "@/components/Icons";

/* ───────────────────────── DATA ───────────────────────── */

const FULLY_MANAGED_FEATURES = [
  "Marketing the property and conducting viewings",
  "Tenant referencing and Right to Rent checks",
  "Preparing tenancy agreements and move-in documentation",
  "Collecting rent and managing arrears",
  "Registering and managing the tenancy deposit",
  "Ensuring all compliance certificates are valid (Gas Safety, EICR, EPC, alarms)",
  "Serving all legally required documents and notices",
  "Handling day-to-day tenant communication",
  "Arranging maintenance and emergency repairs 24/7",
  "Carrying out regular property inspections",
  "Managing rent reviews",
  "Dealing with end-of-tenancy check-outs and deposit negotiations",
  "Handling legal processes if required (e.g. notices, possession)",
];

const LET_ONLY_FEATURES = [
  "Marketing the property and conducting viewings",
  "Tenant referencing and Right to Rent checks",
  "Preparing tenancy agreements and move-in documentation",
  "Ensuring all compliance certificates are valid (at the beginning of the tenancy)",
  "Moving the tenants in and then hand over to the landlord",
];

const WHY_CHOOSE = [
  {
    icon: UserGroupIcon,
    title: "Personal Service",
    description:
      "David handles everything personally. You deal directly with the decision-maker, not a call centre or junior staff.",
  },
  {
    icon: ClockIcon,
    title: "25+ Years Experience",
    description:
      "In the industry since 2000 and founded McGowan Lettings in 2007. We know Greater Manchester inside out.",
  },
  {
    icon: CurrencyIcon,
    title: "No Let, No Fee",
    description:
      "You only pay when we successfully let your property. No hidden charges, no upfront costs, no surprises.",
  },
  {
    icon: BuildingIcon,
    title: "Local Market Knowledge",
    description:
      "Specialists in Bury, Bolton, Manchester and Rossendale. We know the right rental price for every street.",
  },
  {
    icon: HomeIcon,
    title: "Zoopla & PrimeLocation",
    description:
      "Your property is listed on the UK's leading portals, reaching thousands of quality tenants searching every day.",
  },
  {
    icon: ShieldIcon,
    title: "Fully Regulated",
    description:
      "Registered with TDS, SafeAgent and The Property Ombudsman. Your investment is in safe, compliant hands.",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Free Valuation",
    description:
      "We visit your property, assess the local market and provide an honest, no-obligation rental valuation.",
  },
  {
    step: "02",
    title: "Marketing & Viewings",
    description:
      "Professional photography, listings on Zoopla, PrimeLocation and local press. We conduct viewings at times that suit prospective tenants.",
  },
  {
    step: "03",
    title: "Tenant Referencing",
    description:
      "Thorough credit, employment and previous landlord checks. We only place tenants we are confident in.",
  },
  {
    step: "04",
    title: "Move-In & Management",
    description:
      "Tenancy signed, deposit secured with TDS. For managed properties, we take it from here.",
  },
];

/* ───────────────────────── PAGE ───────────────────────── */

export default function LandlordsPage() {
  return (
    <>
      {/* ─── HERO ─── */}
      <section className="relative h-[40vh] min-h-[320px] flex items-center overflow-hidden noise-overlay bg-dark pt-16">
        <div className="absolute inset-0">
          <Image
            src="/hero.jpg"
            alt="Greater Manchester"
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
              For Landlords
            </span>
            <div className="w-8 h-px bg-brand" />
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold text-white leading-[1.1] mb-4">
            Landlord Services
          </h1>
          <p className="text-white/70 text-lg md:text-xl max-w-xl mx-auto">
            Flexible letting solutions — from single property owners to professional
            portfolio investors. Competitive rates, no hidden charges.
          </p>
        </div>
      </section>

      {/* ─── SERVICE COMPARISON ─── */}
      <section className="bg-cream py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6">
          <AnimateIn>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-px bg-brand" />
              <span className="text-brand text-sm font-semibold tracking-[0.15em] uppercase">
                Our Services
              </span>
            </div>
            <h2 className="font-heading text-3xl md:text-4xl font-semibold text-dark mb-4">
              Choose the Right Package for You
            </h2>
            <p className="text-text-muted text-lg max-w-2xl mb-14">
              We will never forget that your property is one of your most important
              assets. Every property is treated as if it was our own home. Choose
              from fully managed or let only — both at competitive rates with no
              hidden fees.
            </p>
          </AnimateIn>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Fully Managed */}
            <AnimateIn>
              <div className="bg-white rounded-lg p-8 md:p-10 border border-black/5 shadow-sm relative overflow-hidden h-full">
                <div className="absolute top-0 left-0 h-[3px] w-full bg-brand" />
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 bg-brand/10 rounded-lg flex items-center justify-center">
                    <ShieldIcon className="w-6 h-6 text-brand-dark" />
                  </div>
                  <span className="text-[10px] font-semibold bg-brand/10 text-brand-dark px-2.5 py-1 rounded tracking-wider uppercase">
                    Popular
                  </span>
                </div>
                <h3 className="font-heading text-2xl font-semibold text-dark mb-2">
                  Fully Managed
                </h3>
                <p className="text-text-muted mb-6 leading-relaxed">
                  Sit back while we handle everything — from finding tenants and
                  collecting rent to coordinating maintenance and serving legal
                  notices. Complete peace of mind.
                </p>
                <ul className="space-y-3 mb-8">
                  {FULLY_MANAGED_FEATURES.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2.5 text-sm text-text-muted"
                    >
                      <CheckIcon className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/valuation"
                  className="inline-flex items-center justify-center gap-2 bg-brand text-dark font-semibold px-6 py-3 rounded-sm hover:bg-brand-light transition-all duration-200 text-sm w-full md:w-auto"
                >
                  Get a Free Valuation
                  <ArrowRightIcon className="w-3.5 h-3.5" />
                </Link>
              </div>
            </AnimateIn>

            {/* Let Only */}
            <AnimateIn delay={0.15}>
              <div className="bg-white rounded-lg p-8 md:p-10 border border-black/5 shadow-sm relative overflow-hidden h-full">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 bg-dark/5 rounded-lg flex items-center justify-center">
                    <KeyIcon className="w-6 h-6 text-dark/60" />
                  </div>
                </div>
                <h3 className="font-heading text-2xl font-semibold text-dark mb-2">
                  Let Only
                </h3>
                <p className="text-text-muted mb-6 leading-relaxed">
                  We find and vet the right tenant, prepare all the paperwork and
                  hand over the keys — then you take it from there. Ideal for
                  hands-on landlords.
                </p>
                <ul className="space-y-3 mb-8">
                  {LET_ONLY_FEATURES.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2.5 text-sm text-text-muted"
                    >
                      <CheckIcon className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 border border-dark/20 text-dark font-semibold px-6 py-3 rounded-sm hover:bg-dark hover:text-white transition-all duration-200 text-sm w-full md:w-auto"
                >
                  Enquire Now
                  <ArrowRightIcon className="w-3.5 h-3.5" />
                </Link>
              </div>
            </AnimateIn>
          </div>

          {/* No Let No Fee callout */}
          <AnimateIn delay={0.3} className="mt-8">
            <div className="bg-dark rounded-lg p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-brand/10 rounded-full flex items-center justify-center shrink-0">
                  <CurrencyIcon className="w-5 h-5 text-brand" />
                </div>
                <div>
                  <p className="text-white font-semibold">
                    No let — no fee. No hidden charges.
                  </p>
                  <p className="text-white/50 text-sm">
                    Both services come with transparent, competitive pricing. You
                    only pay when your property is successfully let.
                  </p>
                </div>
              </div>
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* ─── WHY CHOOSE US ─── */}
      <section className="bg-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6">
          <AnimateIn>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-px bg-brand" />
              <span className="text-brand text-sm font-semibold tracking-[0.15em] uppercase">
                Why McGowan Lettings
              </span>
            </div>
            <h2 className="font-heading text-3xl md:text-4xl font-semibold text-dark mb-4">
              Why Choose McGowan Lettings?
            </h2>
            <p className="text-text-muted text-lg max-w-2xl mb-14">
              We are not a faceless corporate agency. When you work with McGowan
              Lettings, you work directly with David — an experienced professional
              who genuinely cares about your property.
            </p>
          </AnimateIn>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {WHY_CHOOSE.map((item, i) => (
              <AnimateIn key={item.title} delay={i * 0.1}>
                <div className="bg-white rounded-lg p-8 border border-black/5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden h-full">
                  <div className="absolute top-0 left-0 h-[3px] w-0 bg-brand group-hover:w-full transition-all duration-500 ease-out" />
                  <div className="w-12 h-12 bg-brand/10 rounded-lg flex items-center justify-center mb-5">
                    <item.icon className="w-6 h-6 text-brand-dark" />
                  </div>
                  <h3 className="font-heading text-xl font-semibold text-dark mb-2">
                    {item.title}
                  </h3>
                  <p className="text-text-muted text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="bg-cream py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6">
          <AnimateIn>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-px bg-brand" />
              <span className="text-brand text-sm font-semibold tracking-[0.15em] uppercase">
                The Process
              </span>
            </div>
            <h2 className="font-heading text-3xl md:text-4xl font-semibold text-dark mb-4">
              How It Works
            </h2>
            <p className="text-text-muted text-lg max-w-2xl mb-14">
              From initial valuation to tenant move-in, we make the letting process
              straightforward and stress-free.
            </p>
          </AnimateIn>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map((item, i) => (
              <AnimateIn key={item.step} delay={i * 0.1}>
                <div className="bg-white rounded-lg border border-black/5 p-6 h-full relative group hover:shadow-lg transition-shadow duration-300">
                  <span className="text-5xl font-heading font-bold text-brand/15 absolute top-4 right-5 select-none">
                    {item.step}
                  </span>
                  <div className="w-12 h-12 bg-brand/10 rounded-full flex items-center justify-center mb-5">
                    <span className="text-brand-dark font-heading text-lg font-semibold">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="font-heading text-xl font-semibold text-dark mb-3">
                    {item.title}
                  </h3>
                  <p className="text-text-muted text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─── ACCREDITATION LOGOS ─── */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <AnimateIn>
            <div className="text-center mb-10">
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="w-8 h-px bg-brand" />
                <span className="text-brand text-sm font-semibold tracking-[0.15em] uppercase">
                  Accredited &amp; Featured On
                </span>
                <div className="w-8 h-px bg-brand" />
              </div>
              <p className="text-text-muted">
                Fully regulated and listed on the UK&apos;s leading property portals
              </p>
            </div>
          </AnimateIn>
          <LogoRow />
        </div>
      </section>

      {/* ─── REGULATORY & PROTECTION ─── */}
      <section className="bg-cream py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6">
          <AnimateIn>
            <div className="text-center max-w-2xl mx-auto mb-14">
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="w-8 h-px bg-brand" />
                <span className="text-brand text-sm font-semibold tracking-[0.15em] uppercase">
                  Regulated &amp; Protected
                </span>
                <div className="w-8 h-px bg-brand" />
              </div>
              <h2 className="font-heading text-3xl md:text-4xl font-semibold text-dark mb-4">
                Your Investment Is in Safe Hands
              </h2>
              <p className="text-text-muted leading-relaxed">
                We are fully regulated and committed to the highest standards of
                professionalism, transparency, and client protection.
              </p>
            </div>
          </AnimateIn>

          <div className="grid md:grid-cols-2 gap-6">
            {/* CMP */}
            <AnimateIn>
              <div className="bg-white rounded-lg border border-black/5 p-8 md:p-10 shadow-sm text-center h-full flex flex-col group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                <div className="absolute top-0 left-0 h-[3px] w-0 bg-brand group-hover:w-full transition-all duration-500 ease-out" />
                <div className="w-14 h-14 bg-brand/10 rounded-full flex items-center justify-center mx-auto mb-5">
                  <ShieldIcon className="w-7 h-7 text-brand-dark" />
                </div>
                <h3 className="font-heading text-xl font-semibold text-dark mb-3">
                  Client Money Protection
                </h3>
                <p className="text-text-muted text-sm leading-relaxed mb-6 flex-1">
                  McGowan Residential Lettings LTD are a member of the client money
                  protection scheme provided by SafeAgent. This scheme protects
                  clients money held by our business.
                </p>
                <a
                  href="/certificates/cmp-certificate.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-brand-dark hover:text-brand transition-colors"
                >
                  View CMP Certificate
                  <ArrowRightIcon className="w-3.5 h-3.5" />
                </a>
              </div>
            </AnimateIn>

            {/* TPO */}
            <AnimateIn delay={0.15}>
              <div className="bg-white rounded-lg border border-black/5 p-8 md:p-10 shadow-sm text-center h-full flex flex-col group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                <div className="absolute top-0 left-0 h-[3px] w-0 bg-brand group-hover:w-full transition-all duration-500 ease-out" />
                <div className="w-14 h-14 bg-brand/10 rounded-full flex items-center justify-center mx-auto mb-5">
                  <CheckIcon className="w-7 h-7 text-brand-dark" />
                </div>
                <h3 className="font-heading text-xl font-semibold text-dark mb-3">
                  The Property Ombudsman
                </h3>
                <p className="text-text-muted text-sm leading-relaxed mb-6 flex-1">
                  We are a member of The Property Ombudsman scheme and follow the
                  TPO Code of Practice. If you ever need to raise a concern, our
                  complaints procedure ensures fair and transparent resolution.
                </p>
                <Link
                  href="/complaints"
                  className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-brand-dark hover:text-brand transition-colors"
                >
                  View Complaints Procedure
                  <ArrowRightIcon className="w-3.5 h-3.5" />
                </Link>
              </div>
            </AnimateIn>
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-16 md:py-24 bg-dark relative overflow-hidden noise-overlay">
        <div className="absolute inset-0 bg-gradient-to-br from-dark via-dark/95 to-brand/10" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
          <AnimateIn>
            <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-semibold text-white mb-6">
              Ready to Let Your Property?
            </h2>
            <p className="text-white/70 text-lg max-w-xl mx-auto mb-10">
              Get in touch for a free, no-obligation property valuation. David will
              personally assess your property and recommend the best approach for
              maximising your rental income.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/valuation"
                className="inline-flex items-center gap-2 bg-brand text-dark font-semibold px-8 py-3.5 rounded-sm hover:bg-brand-light transition-colors"
              >
                Request a Free Valuation
                <ArrowRightIcon className="w-3.5 h-3.5" />
              </Link>
              <a
                href="tel:01617976967"
                className="inline-flex items-center gap-2 border border-white/20 text-white font-semibold px-8 py-3.5 rounded-sm hover:bg-white/10 transition-colors"
              >
                <PhoneIcon className="w-4 h-4" />
                Call David Directly
              </a>
            </div>
          </AnimateIn>
        </div>
      </section>
    </>
  );
}
