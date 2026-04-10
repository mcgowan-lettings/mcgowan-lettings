"use client";

import { useState, useEffect, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { AnimateIn, CountUp } from "@/components/AnimateIn";
import LogoRow from "@/components/LogoRow";
import TestimonialsCarousel from "@/components/TestimonialsCarousel";
import { submitContactForm } from "@/app/actions/contact";
import {
  BedIcon,
  BathIcon,
  PhoneIcon,
  WhatsAppIcon,
  MailIcon,
  MapPinIcon,
  ChevronDownIcon,
  SearchIcon,
  ArrowRightIcon,
  ShieldIcon,
  CheckIcon,
  KeyIcon,
} from "@/components/Icons";

/* ───────────────────────── DATA ───────────────────────── */

type FeaturedProperty = {
  id: string;
  images: string[];
  price: number;
  title: string;
  location: string;
  beds: number;
  baths: number;
  type: string;
};

const AREAS: { name: string; neighbourhoods: string[]; main?: boolean }[] = [
  { name: "Bury", neighbourhoods: ["Tottington", "Ramsbottom", "Whitefield", "Radcliffe", "Prestwich"], main: true },
  { name: "Bolton", neighbourhoods: ["Farnworth", "Harwood", "Horwich", "Westhoughton", "Lostock"] },
  { name: "Manchester", neighbourhoods: ["Deansgate", "Ancoats", "Salford", "Eccles", "Chorlton"] },
  { name: "Rossendale", neighbourhoods: ["Rawtenstall", "Haslingden", "Bacup", "Waterfoot"] },
  { name: "Accrington", neighbourhoods: ["Great Harwood", "Clayton-le-Moors", "Oswaldtwistle", "Rishton"] },
  { name: "Burnley", neighbourhoods: ["Padiham", "Brierfield", "Nelson", "Colne"] },
];

const STATS = [
  { value: 300, suffix: "+", label: "Properties Managed" },
  { value: 25, suffix: "+", label: "Years Experience" },
  { value: 98, suffix: "%", label: "Tenant Satisfaction" },
  { value: 99, suffix: "%", label: "Landlord Satisfaction" },
];

/* ───────────────────────── HOME CONTACT FORM ───────────────────────── */

function HomeContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    enquiryType: "Tenant looking for a property",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const result = await submitContactForm({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      type: formData.enquiryType,
      message: formData.message,
    });

    setSubmitting(false);

    if (result.success) {
      setSubmitted(true);
    } else {
      setError(result.error);
    }
  }

  if (submitted) {
    return (
      <div className="bg-white rounded-lg p-6 sm:p-8 md:p-10 border border-black/5 shadow-sm">
        <div className="text-center py-8 flex flex-col items-center justify-center min-h-[300px]">
          <div className="w-14 h-14 rounded-full bg-brand/10 flex items-center justify-center mx-auto mb-4">
            <MailIcon className="w-7 h-7 text-brand" />
          </div>
          <h3 className="font-heading text-xl text-dark mb-2">Message Sent</h3>
          <p className="text-text-muted text-sm max-w-sm mx-auto">
            Thank you for getting in touch. David will respond to your enquiry shortly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 sm:p-8 md:p-10 border border-black/5 shadow-sm">
      <h3 className="font-heading text-xl font-semibold text-dark mb-6">Send a Message</h3>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border border-black/10 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-colors bg-white"
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full border border-black/10 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-colors bg-white"
              placeholder="Your number"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">Email</label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full border border-black/10 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-colors bg-white"
            placeholder="your@email.com"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">I am a...</label>
          <div className="relative">
            <select
              value={formData.enquiryType}
              onChange={(e) => setFormData({ ...formData, enquiryType: e.target.value })}
              className="w-full border border-black/10 rounded-md px-4 py-2.5 text-sm appearance-none cursor-pointer focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-colors bg-white"
            >
              <option>Tenant looking for a property</option>
              <option>Landlord seeking management</option>
              <option>Landlord requesting a valuation</option>
              <option>Other enquiry</option>
            </select>
            <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-light pointer-events-none" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">Message</label>
          <textarea
            rows={4}
            required
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            className="w-full border border-black/10 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-colors bg-white resize-none"
            placeholder="Tell us how we can help..."
          />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-brand hover:bg-brand-light text-dark font-semibold py-3 rounded-md transition-all duration-200 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? "Sending..." : "Send Message"}
        </button>
      </form>
    </div>
  );
}

/* ───────────────────────── MAIN PAGE ───────────────────────── */

export default function HomePage() {
  const router = useRouter();
  const [heroArea, setHeroArea] = useState("");
  const [heroPrice, setHeroPrice] = useState("");
  const [heroBeds, setHeroBeds] = useState("");
  const [heroType, setHeroType] = useState("");
  const [featuredProperties, setFeaturedProperties] = useState<FeaturedProperty[]>([]);

  useEffect(() => {
    async function fetchFeatured() {
      const { data } = await supabase
        .from("properties")
        .select("id, title, price, location, beds, baths, type, images")
        .eq("active", true)
        .eq("featured", true)
        .order("created_at", { ascending: false })
        .limit(6);
      if (data) {
        // Show 6 or 3 so the grid is always full
        setFeaturedProperties(data.length >= 6 ? data.slice(0, 6) : data.slice(0, 3));
      }
    }
    fetchFeatured();
  }, []);

  function handleSearch() {
    const params = new URLSearchParams();
    if (heroArea) params.set("area", heroArea);
    if (heroPrice) params.set("maxPrice", heroPrice);
    if (heroBeds) params.set("bedrooms", heroBeds);
    if (heroType) params.set("type", heroType);
    const qs = params.toString();
    router.push(`/properties${qs ? `?${qs}` : ""}`);
  }

  return (
    <>
      {/* ─── HERO ─── */}
      <section className="relative min-h-[90vh] md:min-h-screen flex items-center justify-center overflow-hidden noise-overlay">
        {/* Background image */}
        <div className="absolute inset-0">
          <Image
            src="/hero.jpg"
            alt="Manchester skyline"
            fill
            sizes="(max-width: 768px) 200vw, 100vw"
            quality={90}
            className="object-cover object-bottom"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-dark/70 via-dark/35 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-dark/25 via-transparent to-dark/20" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-16 w-full">
          <div className="max-w-3xl">
            {/* Eyebrow */}
            <div className="animate-fade-in-up stagger-1 flex items-center gap-2 mb-6">
              <div className="w-8 h-px bg-brand" />
              <span className="text-brand text-sm font-semibold tracking-[0.15em] uppercase">
                Greater Manchester
              </span>
            </div>

            {/* Headline */}
            <h1 className="animate-fade-in-up stagger-2 font-heading text-5xl md:text-6xl lg:text-7xl font-semibold text-white leading-[1.08] mb-6">
              Find Your
              <br />
              Perfect Rental
              <span className="text-gradient-brand block">Home</span>
            </h1>

            {/* Subheadline */}
            <p className="animate-fade-in-up stagger-3 text-white text-lg md:text-xl max-w-xl mb-10 leading-relaxed">
              Professional letting agents covering Bury, Bolton, Manchester &
              Rossendale. Trusted by landlords and tenants for over 25 years.
            </p>
          </div>

          {/* Search bar */}
          <div className="animate-fade-in-up stagger-4 bg-white/10 backdrop-blur-xl rounded-lg border border-white/10 p-4 md:p-5 max-w-4xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="relative">
                <label className="text-white/40 text-xs font-medium uppercase tracking-wider mb-1.5 block">Area</label>
                <div className="relative">
                  <select value={heroArea} onChange={(e) => setHeroArea(e.target.value)} className="w-full bg-white/10 border border-white/10 rounded-md text-white text-sm px-3 py-2.5 appearance-none cursor-pointer focus:outline-none focus:border-brand/50 transition-colors">
                    <option value="">All Areas</option>
                    <option value="Bury">Bury</option>
                    <option value="Bolton">Bolton</option>
                    <option value="Manchester">Manchester</option>
                    <option value="Rossendale">Rossendale</option>
                    <option value="Accrington">Accrington</option>
                    <option value="Burnley">Burnley</option>
                  </select>
                  <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40 pointer-events-none" />
                </div>
              </div>

              <div className="relative">
                <label className="text-white/40 text-xs font-medium uppercase tracking-wider mb-1.5 block">Max Price</label>
                <div className="relative">
                  <select value={heroPrice} onChange={(e) => setHeroPrice(e.target.value)} className="w-full bg-white/10 border border-white/10 rounded-md text-white text-sm px-3 py-2.5 appearance-none cursor-pointer focus:outline-none focus:border-brand/50 transition-colors">
                    <option value="">Any Price</option>
                    <option value="£500">£500 pcm</option>
                    <option value="£750">£750 pcm</option>
                    <option value="£1,000">£1,000 pcm</option>
                    <option value="£1,250">£1,250 pcm</option>
                    <option value="£1,500">£1,500 pcm</option>
                    <option value="£2,000+">£2,000+ pcm</option>
                  </select>
                  <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40 pointer-events-none" />
                </div>
              </div>

              <div className="relative">
                <label className="text-white/40 text-xs font-medium uppercase tracking-wider mb-1.5 block">Bedrooms</label>
                <div className="relative">
                  <select value={heroBeds} onChange={(e) => setHeroBeds(e.target.value)} className="w-full bg-white/10 border border-white/10 rounded-md text-white text-sm px-3 py-2.5 appearance-none cursor-pointer focus:outline-none focus:border-brand/50 transition-colors">
                    <option value="">Any</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4+">4+</option>
                  </select>
                  <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40 pointer-events-none" />
                </div>
              </div>

              <div className="relative">
                <label className="text-white/40 text-xs font-medium uppercase tracking-wider mb-1.5 block">Type</label>
                <div className="relative">
                  <select value={heroType} onChange={(e) => setHeroType(e.target.value)} className="w-full bg-white/10 border border-white/10 rounded-md text-white text-sm px-3 py-2.5 appearance-none cursor-pointer focus:outline-none focus:border-brand/50 transition-colors">
                    <option value="">All Types</option>
                    <option value="House">House</option>
                    <option value="Apartment">Apartment</option>
                    <option value="Flat">Flat</option>
                    <option value="Bungalow">Bungalow</option>
                  </select>
                  <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40 pointer-events-none" />
                </div>
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleSearch}
                  className="w-full bg-brand hover:bg-brand-light text-dark font-semibold py-2.5 px-6 rounded-md flex items-center justify-center gap-2 transition-all duration-200"
                >
                  <SearchIcon className="w-4 h-4" />
                  <span className="text-sm">Search</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── STATS BAR ─── */}
      <section className="bg-dark relative z-10">
        <div className="max-w-7xl mx-auto px-6 py-10 md:py-14">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 md:gap-4">
            {STATS.map((stat, i) => (
              <AnimateIn key={stat.label} delay={i * 0.1} className="text-center">
                <div className="text-3xl md:text-4xl lg:text-5xl font-heading font-semibold text-brand mb-1">
                  <CountUp value={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-white/50 text-sm tracking-wide">{stat.label}</div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SERVICES ─── */}
      <section className="bg-cream py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6">
          <AnimateIn className="max-w-2xl mb-16">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-px bg-brand" />
              <span className="text-brand text-sm font-semibold tracking-[0.15em] uppercase">Our Services</span>
            </div>
            <h2 className="font-heading text-3xl md:text-4xl font-semibold text-dark leading-tight mb-4">
              Lettings Solutions for
              <br />
              Every Landlord
            </h2>
            <p className="text-text-muted leading-relaxed">
              Whether you want complete peace of mind or prefer a hands-on approach,
              we offer flexible management options tailored to your needs.
            </p>
          </AnimateIn>

          <AnimateIn delay={0.15} className="grid md:grid-cols-2 gap-6">
            {/* Fully Managed */}
            <div className="bg-white rounded-lg p-8 md:p-10 border border-black/5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
              <div className="absolute top-0 left-0 h-[3px] w-0 bg-brand group-hover:w-full transition-all duration-500 ease-out" />
              <div>
                <div className="w-12 h-12 bg-brand/10 rounded-lg flex items-center justify-center mb-6">
                  <ShieldIcon className="w-6 h-6 text-brand-dark" />
                </div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-heading text-2xl font-semibold text-dark">Fully Managed</h3>
                  <span className="text-[10px] font-semibold bg-brand/10 text-brand-dark px-2 py-0.5 rounded tracking-wider uppercase">Popular</span>
                </div>
                <p className="text-text-muted mb-6 leading-relaxed">
                  Sit back while we handle everything — from finding tenants to managing
                  maintenance, rent collection, and legal compliance.
                </p>
                <ul className="space-y-3 mb-8">
                  {[
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
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-text-muted">
                      <CheckIcon className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link href="/landlords" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-dark hover:text-brand transition-colors group/link">
                  Learn more
                  <ArrowRightIcon className="w-3.5 h-3.5 group-hover/link:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Let Only */}
            <div className="bg-white rounded-lg p-8 md:p-10 border border-black/5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
              <div className="absolute top-0 left-0 h-[3px] w-0 bg-brand group-hover:w-full transition-all duration-500 ease-out" />
              <div>
                <div className="w-12 h-12 bg-dark/5 rounded-lg flex items-center justify-center mb-6">
                  <KeyIcon className="w-6 h-6 text-dark/60" />
                </div>
                <h3 className="font-heading text-2xl font-semibold text-dark mb-2">Let Only</h3>
                <p className="text-text-muted mb-6 leading-relaxed">
                  We find and vet the right tenant for your property, then hand over
                  the reins for you to manage directly.
                </p>
                <ul className="space-y-3 mb-8">
                  {[
                    "Marketing the property and conducting viewings",
                    "Tenant referencing and Right to Rent checks",
                    "Preparing tenancy agreements and move-in documentation",
                    "Ensuring all compliance certificates are valid (at the beginning of the tenancy)",
                    "Moving the tenants in and then hand over to the landlord",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-text-muted">
                      <CheckIcon className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link href="/landlords" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-dark hover:text-brand transition-colors group/link">
                  Learn more
                  <ArrowRightIcon className="w-3.5 h-3.5 group-hover/link:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* ─── FEATURED PROPERTIES ─── */}
      <section className="bg-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6">
          <AnimateIn className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-px bg-brand" />
                <span className="text-brand text-sm font-semibold tracking-[0.15em] uppercase">Featured Listings</span>
              </div>
              <h2 className="font-heading text-3xl md:text-4xl font-semibold text-dark leading-tight">
                Available Properties
              </h2>
            </div>
            <Link
              href="/properties"
              className="inline-flex items-center gap-2 text-sm font-semibold text-dark border border-dark/20 px-5 py-2.5 rounded-sm hover:bg-dark hover:text-white transition-all duration-200"
            >
              View All Properties
              <ArrowRightIcon className="w-3.5 h-3.5" />
            </Link>
          </AnimateIn>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProperties.map((property, i) => (
              <AnimateIn key={property.id} delay={i * 0.1}>
                <Link href={`/properties/${property.id}`}>
                  <article className="property-card group bg-white rounded-lg border border-black/5 overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-lg">
                    <div className="relative aspect-[4/3] overflow-hidden bg-warm-grey">
                      <Image
                        src={property.images?.[0] || "/hero.jpg"}
                        alt={property.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="property-image object-cover transition-transform duration-700 ease-out"
                      />
                      <div className="absolute bottom-3 left-3 bg-dark/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-sm">
                        <span className="text-lg font-semibold">£{property.price.toLocaleString()}</span>
                        <span className="text-white/50 text-xs ml-1">pcm</span>
                      </div>
                      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-dark text-xs font-medium px-2.5 py-1 rounded-sm">
                        {property.type}
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="font-semibold text-dark mb-1 group-hover:text-brand-dark transition-colors">
                        {property.title}
                      </h3>
                      <div className="flex items-center gap-1 text-text-muted text-sm mb-4">
                        <MapPinIcon className="w-3.5 h-3.5" />
                        {property.location}
                      </div>
                      <div className="flex items-center gap-4 pt-4 border-t border-black/5">
                        <div className="flex items-center gap-1.5 text-sm text-text-muted">
                          <BedIcon className="w-4 h-4" />
                          <span>{property.beds} {property.beds === 1 ? "Bed" : "Beds"}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-text-muted">
                          <BathIcon className="w-4 h-4" />
                          <span>{property.baths} {property.baths === 1 ? "Bath" : "Baths"}</span>
                        </div>
                      </div>
                    </div>
                  </article>
                </Link>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <TestimonialsCarousel />

      {/* ─── ABOUT / WHY CHOOSE US ─── */}
      <section className="bg-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <AnimateIn>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-px bg-brand" />
                <span className="text-brand text-sm font-semibold tracking-[0.15em] uppercase">About McGowan Lettings</span>
              </div>
              <h2 className="font-heading text-3xl md:text-4xl font-semibold text-dark leading-tight mb-6">
                A Personal Approach to
                <br />
                Property Lettings
              </h2>
              <p className="text-text-muted leading-relaxed mb-6">
                With over 25 years of experience in the Greater Manchester lettings market,
                McGowan Residential Lettings provides a hands-on, personal service that larger
                agencies simply can&apos;t match. Founded in 2007 by David McGowan, who has been
                in the industry since 2000, we know every street, every neighbourhood,
                and every nuance of the local rental market.
              </p>
              <p className="text-text-muted leading-relaxed mb-8">
                Whether you&apos;re a landlord looking for reliable tenants or a tenant searching
                for your next home, David McGowan and the team are here to make the
                process smooth, transparent, and stress-free.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 bg-brand text-dark font-semibold px-6 py-3 rounded-sm hover:bg-brand-light transition-all duration-200 text-sm"
                >
                  Get in Touch
                  <ArrowRightIcon className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href="/landlords"
                  className="inline-flex items-center justify-center gap-2 border border-dark/20 text-dark font-semibold px-6 py-3 rounded-sm hover:bg-dark hover:text-white transition-all duration-200 text-sm"
                >
                  Our Services
                </Link>
              </div>
            </AnimateIn>

            <AnimateIn delay={0.2} className="relative mb-8 lg:mb-0">
              <div className="aspect-[3/4] md:aspect-[4/5] rounded-lg overflow-hidden relative">
                <Image
                  src="/david-mcgowan.jpg"
                  alt="David McGowan, founder of McGowan Residential Lettings"
                  fill
                  className="object-cover object-[center_10%]"
                />
              </div>
              <div className="absolute -bottom-6 left-0 lg:-left-6 bg-dark text-white p-6 rounded-lg shadow-2xl max-w-[240px]">
                <div className="text-3xl font-heading font-semibold text-brand mb-1">25+</div>
                <div className="text-white/80 text-sm">Years trusted by landlords &amp; tenants across Greater Manchester</div>
              </div>
            </AnimateIn>
          </div>
        </div>
      </section>

      {/* ─── AREAS COVERED ─── */}
      <section className="bg-dark py-16 md:py-24 relative overflow-hidden noise-overlay">
        <div className="absolute inset-0 opacity-[0.02]">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <AnimateIn className="text-center max-w-2xl mx-auto mb-16">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-8 h-px bg-brand" />
              <span className="text-brand text-sm font-semibold tracking-[0.15em] uppercase">Areas We Cover</span>
              <div className="w-8 h-px bg-brand" />
            </div>
            <h2 className="font-heading text-3xl md:text-4xl font-semibold text-white leading-tight mb-4">
              Across Greater Manchester
            </h2>
            <p className="text-white/50 leading-relaxed">
              We cover all areas across Greater Manchester and beyond.
              Based in Bury, we operate right across the region — if the
              property is in good order, we&apos;ll cover it.
            </p>
          </AnimateIn>

          <div className="flex flex-wrap justify-center gap-6 max-w-5xl mx-auto [&>*]:w-full [&>*]:sm:w-[calc(50%-12px)] [&>*]:lg:w-[calc(33.333%-16px)]">
            {AREAS.map((area, i) => (
              <AnimateIn key={area.name} delay={i * 0.1}>
                <div className="bg-white/5 border border-white/10 rounded-lg p-6 hover:bg-white/10 hover:border-brand/20 transition-all duration-300 group">
                  <div className="flex items-center gap-3 mb-4">
                    <MapPinIcon className="w-5 h-5 text-brand" />
                    <h3 className="font-heading text-xl font-semibold text-white group-hover:text-brand transition-colors">
                      {area.name}
                      {area.main && (
                        <span className="ml-2 text-[10px] font-semibold bg-brand/20 text-brand px-2 py-0.5 rounded tracking-wider uppercase align-middle">
                          Main Area
                        </span>
                      )}
                    </h3>
                  </div>
                  <ul className="space-y-2">
                    {area.neighbourhoods.map((n) => (
                      <li key={n} className="text-white/40 text-sm flex items-center gap-2">
                        <div className="w-1 h-1 bg-brand/50 rounded-full" />
                        {n}
                      </li>
                    ))}
                  </ul>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TENANTS SECTION ─── */}
      <section className="bg-cream py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <div className="aspect-[3/2] rounded-lg overflow-hidden relative">
                <Image
                  src="https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&h=533&fit=crop"
                  alt="Beautiful rental property interior"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-px bg-brand" />
                <span className="text-brand text-sm font-semibold tracking-[0.15em] uppercase">For Tenants</span>
              </div>
              <h2 className="font-heading text-3xl md:text-4xl font-semibold text-dark leading-tight mb-6">
                Finding Your Next Home
                <br />
                Made Simple
              </h2>
              <p className="text-text-muted leading-relaxed mb-8">
                We make renting straightforward and stress-free. From your first viewing to
                picking up the keys, we&apos;re with you every step of the way.
              </p>
              <div className="space-y-4 mb-8">
                {[
                  { step: "01", title: "Browse & Enquire", desc: "Search our available properties and get in touch about viewings" },
                  { step: "02", title: "View & Apply", desc: "We'll arrange viewings at times that suit you, then handle referencing" },
                  { step: "03", title: "Move In", desc: "Sign your tenancy, pay your deposit, and collect the keys" },
                ].map((item) => (
                  <div key={item.step} className="flex gap-4 items-start">
                    <div className="w-10 h-10 bg-brand/10 rounded-lg flex items-center justify-center shrink-0">
                      <span className="text-brand-dark font-semibold text-sm">{item.step}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-dark text-sm mb-0.5">{item.title}</h3>
                      <p className="text-text-muted text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                href="/tenants"
                className="inline-flex items-center gap-2 text-sm font-semibold text-dark border border-dark/20 px-5 py-2.5 rounded-sm hover:bg-dark hover:text-white transition-all duration-200"
              >
                Tenant Information
                <ArrowRightIcon className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── ACCREDITATIONS ─── */}
      <section className="bg-warm-grey py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6">
          <AnimateIn className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-8 h-px bg-brand" />
              <span className="text-brand text-sm font-semibold tracking-[0.15em] uppercase">Accredited & Featured On</span>
              <div className="w-8 h-px bg-brand" />
            </div>
            <p className="text-text-muted text-sm">Fully regulated and listed on the UK&apos;s leading property portals</p>
          </AnimateIn>
          <LogoRow />
        </div>
      </section>

      {/* ─── FREE VALUATION CTA ─── */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-brand" />
        <div className="absolute inset-0 bg-gradient-to-br from-brand via-brand-dark to-brand opacity-90" />
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/5 rounded-full" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/5 rounded-full" />

        <AnimateIn className="max-w-4xl mx-auto px-6 relative z-10 text-center">
          <h2 className="font-heading text-3xl md:text-5xl font-semibold text-dark leading-tight mb-4">
            What Could Your Property Earn?
          </h2>
          <p className="text-dark/70 text-lg mb-10 max-w-2xl mx-auto">
            Get a free, no-obligation rental valuation from our local experts.
            We&apos;ll provide an accurate market assessment within 24 hours.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/valuation"
              className="bg-dark text-white font-semibold px-8 py-3.5 rounded-sm hover:bg-dark-soft transition-colors duration-200 text-sm flex items-center gap-2"
            >
              Request Free Valuation
              <ArrowRightIcon className="w-3.5 h-3.5" />
            </Link>
            <a
              href="tel:01617976967"
              className="flex items-center gap-2 text-dark font-semibold text-sm border border-dark/20 px-6 py-3.5 rounded-sm hover:bg-dark/10 transition-colors"
            >
              <PhoneIcon className="w-4 h-4" />
              Call Us Today
            </a>
          </div>
        </AnimateIn>
      </section>

      {/* ─── CONTACT PREVIEW ─── */}
      <section className="bg-cream py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-px bg-brand" />
                <span className="text-brand text-sm font-semibold tracking-[0.15em] uppercase">Get in Touch</span>
              </div>
              <h2 className="font-heading text-3xl md:text-4xl font-semibold text-dark leading-tight mb-6">
                Let&apos;s Talk Property
              </h2>
              <p className="text-text-muted leading-relaxed mb-10">
                Whether you&apos;re a landlord looking for a reliable letting agent or a
                tenant searching for your next home, we&apos;re here to help. Get in touch
                and David will personally respond within a few hours.
              </p>

              <div className="space-y-6">
                {[
                  { icon: PhoneIcon, label: "Phone", value: "0161 797 6967", href: "tel:01617976967" },
                  { icon: WhatsAppIcon, label: "WhatsApp", value: "+44 7457 428720", href: "https://wa.me/447457428720" },
                  { icon: MailIcon, label: "Email", value: "info@mcgowanlettings.co.uk", href: "mailto:info@mcgowanlettings.co.uk" },
                  { icon: MapPinIcon, label: "Office", value: "PO Box 546, Bury, BL8 9HB" },
                ].map(({ icon: Icon, label, value, href }) => (
                  <div key={label} className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-brand/10 rounded-lg flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-brand-dark" />
                    </div>
                    <div>
                      <div className="font-semibold text-dark text-sm mb-0.5">{label}</div>
                      {href ? (
                        <a href={href} className="text-text-muted text-sm hover:text-brand-dark transition-colors">{value}</a>
                      ) : (
                        <div className="text-text-muted text-sm">{value}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact form */}
            <HomeContactForm />
          </div>
        </div>
      </section>
    </>
  );
}
