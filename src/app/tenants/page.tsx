"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimateIn } from "@/components/AnimateIn";
import LogoRow from "@/components/LogoRow";
import {
  ArrowRightIcon,
  CheckIcon,
  HomeIcon,
  DocumentIcon,
  CurrencyIcon,
  KeyIcon,
  ShieldIcon,
  SearchIcon,
  ChevronDownIcon,
} from "@/components/Icons";

/* ───────────────────────── DATA ───────────────────────── */

const STEPS = [
  {
    num: "01",
    title: "Browse Properties",
    description:
      "Search our available properties online or get in touch and tell us what you're looking for. We'll match you with suitable homes across Greater Manchester.",
    Icon: SearchIcon,
  },
  {
    num: "02",
    title: "Book a Viewing",
    description:
      "Arrange a viewing at a time that suits you. We offer flexible appointments including evenings and weekends so you can see the property in person.",
    Icon: HomeIcon,
  },
  {
    num: "03",
    title: "Referencing & Agreement",
    description:
      "We'll carry out full credit checks along with references from your employer and previous landlords. Once approved, you'll sign a legally binding tenancy agreement.",
    Icon: DocumentIcon,
  },
  {
    num: "04",
    title: "Move In",
    description:
      "Pay your deposit and first month's rent, collect your keys and move into your new home. We'll be on hand to help with anything you need.",
    Icon: KeyIcon,
  },
];

const MOVE_IN_COSTS = [
  {
    title: "Holding Deposit",
    amount: "1 week's rent",
    description:
      "Paid to reserve the property while referencing is carried out. This is deducted from your first month's rent upon signing the tenancy agreement.",
    Icon: ShieldIcon,
  },
  {
    title: "Rental Deposit",
    amount: "Equivalent to 1 month's rent",
    description:
      "Capped at a maximum of 5 weeks' rent. Your deposit is protected with the Tenancy Deposit Scheme (TDS) and returned at the end of your tenancy, subject to an inventory check.",
    Icon: CurrencyIcon,
  },
  {
    title: "First Month's Rent",
    amount: "Due in advance",
    description:
      "Your first month's rent is payable before you move in. Subsequent payments are due monthly on the date specified in your tenancy agreement.",
    Icon: DocumentIcon,
  },
];

const RESPONSIBILITIES = [
  "Gas, electricity and water bills",
  "TV license",
  "Council Tax",
  "Telephone and broadband",
  "Keeping the property clean and in good condition",
  "Reporting maintenance issues promptly",
  "Not making alterations without landlord consent",
  "Allowing access for inspections with reasonable notice",
  "You cannot use your deposit to offset rent payments",
];

const FAQS: { q: string; a: string }[] = [
  {
    q: "What references do I need to provide?",
    a: "We carry out full credit checks and require references from your employer (or accountant if self-employed) and any previous landlords. These help us verify your identity, income and tenancy history.",
  },
  {
    q: "How long is a typical tenancy?",
    a: "From 1 May 2026, all tenancies are Assured Periodic Tenancies. Tenants are required to give 2 months' notice to us if they wish to vacate the property.",
  },
  {
    q: "How do I get my deposit back?",
    a: "At the end of your tenancy, we carry out an inventory check and condition inspection comparing the property to its state at move-in. Provided there is no damage or missing items beyond fair wear and tear, your deposit will be returned in full.",
  },
  {
    q: "Is my deposit protected?",
    a: "Yes. Your deposit is protected with the Tenancy Deposit Scheme (TDS) as required by law. You will receive confirmation of the protection within 30 days of paying your deposit.",
  },
  {
    q: "What happens if I need to change my tenancy agreement?",
    a: "Any changes or amendments to the tenancy agreement during the tenancy incur a fee of \u00a350. This covers the administrative cost of updating the legal documentation.",
  },
  {
    q: "What if I lose my keys?",
    a: "Lost keys or security devices are charged at \u00a350 per replacement. We recommend keeping a spare in a secure location to avoid this charge.",
  },
  {
    q: "What protections are in place?",
    a: "McGowan Residential Lettings is a member of The Property Ombudsman and holds client money protection via Safeagent. This means your money is protected and you have access to an independent redress scheme if needed.",
  },
];

const FEES = [
  {
    item: "Tenancy agreement changes",
    cost: "\u00a350",
    note: "Per amendment during the tenancy",
  },
  {
    item: "Late rent interest",
    cost: "3% above BoE base rate",
    note: "Charged on rent overdue by 14+ days",
  },
  {
    item: "Lost keys / security devices",
    cost: "\u00a350",
    note: "Per replacement key or device",
  },
];

/* ───────────────────────── FAQ ITEM ───────────────────────── */

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-black/5 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left group cursor-pointer"
      >
        <span className="font-body text-dark font-medium pr-4 group-hover:text-brand transition-colors">
          {q}
        </span>
        <ChevronDownIcon
          className={`w-5 h-5 text-text-muted shrink-0 transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className="grid transition-all duration-300 ease-in-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <p className="text-text-muted leading-relaxed pb-5">{a}</p>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── MAIN PAGE ───────────────────────── */

export default function TenantsPage() {
  return (
    <>
      {/* ─── HERO ─── */}
      <section className="relative h-[40vh] min-h-[280px] flex items-center overflow-hidden noise-overlay bg-dark pt-16">
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
              For Tenants
            </span>
            <div className="w-8 h-px bg-brand" />
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold text-white leading-[1.1] mb-4">
            Tenant Information
          </h1>
          <p className="text-white/70 text-lg md:text-xl max-w-xl mx-auto">
            Everything you need to know about finding, securing and settling
            into your new home.
          </p>
        </div>
      </section>

      {/* ─── HOW RENTING WORKS ─── */}
      <section className="py-16 md:py-24 bg-cream">
        <div className="max-w-7xl mx-auto px-6">
          <AnimateIn>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-px bg-brand" />
              <span className="text-brand text-sm font-semibold tracking-[0.15em] uppercase">
                Getting Started
              </span>
            </div>
            <h2 className="font-heading text-3xl md:text-4xl font-semibold text-dark mb-4">
              How Renting Works
            </h2>
            <p className="text-text-muted text-lg max-w-2xl mb-14">
              From your first search to moving day, here is what to expect when
              renting through McGowan Residential Lettings.
            </p>
          </AnimateIn>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((step, i) => (
              <AnimateIn key={step.num} delay={i * 0.1}>
                <div className="bg-white rounded-lg border border-black/5 p-6 h-full relative group hover:shadow-lg transition-shadow duration-300">
                  <span className="text-5xl font-heading font-bold text-brand/15 absolute top-4 right-5 select-none">
                    {step.num}
                  </span>
                  <div className="w-12 h-12 rounded-lg bg-brand/10 flex items-center justify-center mb-5">
                    <step.Icon className="w-6 h-6 text-brand" />
                  </div>
                  <h3 className="font-heading text-xl font-semibold text-dark mb-3">
                    {step.title}
                  </h3>
                  <p className="text-text-muted leading-relaxed text-sm">
                    {step.description}
                  </p>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─── MOVE-IN COSTS ─── */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <AnimateIn>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-px bg-brand" />
              <span className="text-brand text-sm font-semibold tracking-[0.15em] uppercase">
                Costs
              </span>
            </div>
            <h2 className="font-heading text-3xl md:text-4xl font-semibold text-dark mb-4">
              Move-In Costs
            </h2>
            <p className="text-text-muted text-lg max-w-2xl mb-14">
              We believe in full transparency. Here is exactly what you will need
              to pay before moving in.
            </p>
          </AnimateIn>

          <div className="grid md:grid-cols-3 gap-6">
            {MOVE_IN_COSTS.map((cost, i) => (
              <AnimateIn key={cost.title} delay={i * 0.1}>
                <div className="bg-cream rounded-lg border border-black/5 p-8 h-full">
                  <div className="w-12 h-12 rounded-lg bg-brand/10 flex items-center justify-center mb-5">
                    <cost.Icon className="w-6 h-6 text-brand" />
                  </div>
                  <h3 className="font-heading text-xl font-semibold text-dark mb-1">
                    {cost.title}
                  </h3>
                  <p className="text-brand font-semibold text-sm mb-3">
                    {cost.amount}
                  </p>
                  <p className="text-text-muted leading-relaxed text-sm">
                    {cost.description}
                  </p>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─── YOUR RESPONSIBILITIES ─── */}
      <section className="py-16 md:py-24 bg-cream">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <AnimateIn>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-px bg-brand" />
                <span className="text-brand text-sm font-semibold tracking-[0.15em] uppercase">
                  Know Your Role
                </span>
              </div>
              <h2 className="font-heading text-3xl md:text-4xl font-semibold text-dark mb-4">
                Your Responsibilities
              </h2>
              <p className="text-text-muted text-lg mb-8">
                As a tenant, you are responsible for the day-to-day upkeep of
                the property and certain bills. Here is what falls under your
                care during the tenancy.
              </p>
            </AnimateIn>

            <AnimateIn delay={0.15}>
              <div className="bg-white rounded-lg border border-black/5 p-8">
                <ul className="space-y-4">
                  {RESPONSIBILITIES.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-brand/10 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckIcon className="w-3 h-3 text-brand" />
                      </div>
                      <span className="text-dark leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </AnimateIn>
          </div>
        </div>
      </section>

      {/* ─── FAQS ─── */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-5 gap-12">
            <div className="lg:col-span-2">
              <AnimateIn>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-px bg-brand" />
                  <span className="text-brand text-sm font-semibold tracking-[0.15em] uppercase">
                    FAQs
                  </span>
                </div>
                <h2 className="font-heading text-3xl md:text-4xl font-semibold text-dark mb-4">
                  Frequently Asked Questions
                </h2>
                <p className="text-text-muted text-lg">
                  Answers to the most common questions from tenants. If you
                  cannot find what you are looking for, do not hesitate to get in
                  touch.
                </p>
              </AnimateIn>
            </div>

            <div className="lg:col-span-3">
              <AnimateIn delay={0.1}>
                <div className="bg-cream rounded-lg border border-black/5 px-6">
                  {FAQS.map((faq) => (
                    <FAQItem key={faq.q} q={faq.q} a={faq.a} />
                  ))}
                </div>
              </AnimateIn>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEES & CHARGES ─── */}
      <section className="py-16 md:py-24 bg-cream">
        <div className="max-w-7xl mx-auto px-6">
          <AnimateIn>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-px bg-brand" />
              <span className="text-brand text-sm font-semibold tracking-[0.15em] uppercase">
                Transparency
              </span>
            </div>
            <h2 className="font-heading text-3xl md:text-4xl font-semibold text-dark mb-4">
              Fees &amp; Charges
            </h2>
            <p className="text-text-muted text-lg max-w-2xl mb-14">
              The following charges may apply during your tenancy. We are
              committed to being upfront about all costs.
            </p>
          </AnimateIn>

          <AnimateIn delay={0.1}>
            <div className="bg-white rounded-lg border border-black/5 overflow-hidden">
              {/* Table header */}
              <div className="hidden md:grid md:grid-cols-3 bg-dark text-white text-sm font-semibold uppercase tracking-wider">
                <div className="px-6 py-4">Item</div>
                <div className="px-6 py-4">Cost</div>
                <div className="px-6 py-4">Details</div>
              </div>
              {/* Table rows */}
              {FEES.map((fee, i) => (
                <div
                  key={fee.item}
                  className={`grid md:grid-cols-3 px-6 py-5 ${
                    i < FEES.length - 1 ? "border-b border-black/5" : ""
                  }`}
                >
                  <div className="font-semibold text-dark mb-1 md:mb-0">
                    {fee.item}
                  </div>
                  <div className="text-brand font-semibold mb-1 md:mb-0">
                    {fee.cost}
                  </div>
                  <div className="text-text-muted text-sm">{fee.note}</div>
                </div>
              ))}
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* ─── ACCREDITATIONS ─── */}
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
                Your peace of mind is our priority. We are members of leading
                regulatory bodies and featured on major property portals.
              </p>
            </div>
          </AnimateIn>
          <LogoRow />
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-16 md:py-24 bg-dark relative overflow-hidden noise-overlay">
        <div className="absolute inset-0 bg-gradient-to-br from-dark via-dark/95 to-brand/10" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
          <AnimateIn>
            <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-semibold text-white mb-6">
              Looking for Your Next Home?
            </h2>
            <p className="text-white/70 text-lg max-w-xl mx-auto mb-10">
              Browse our available properties across Greater Manchester or get in
              touch to tell us what you are looking for.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/properties"
                className="inline-flex items-center gap-2 bg-brand text-dark font-semibold px-8 py-3.5 rounded-sm hover:bg-brand-light transition-colors"
              >
                View Properties
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 bg-white/10 text-white font-semibold px-8 py-3.5 rounded-sm hover:bg-white/20 transition-colors border border-white/20"
              >
                Get in Touch
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
            </div>
          </AnimateIn>
        </div>
      </section>
    </>
  );
}
