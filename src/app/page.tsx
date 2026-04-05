"use client";

import { useState, useEffect, useRef, type ReactNode } from "react";
import Image from "next/image";

/* ───────────────────────── SCROLL ANIMATION ───────────────────────── */

function AnimateIn({
  children,
  className = "",
  delay = 0,
  fadeOnly = false,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  fadeOnly?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: fadeOnly ? undefined : (visible ? "translateY(0)" : "translateY(24px)"),
        transition: fadeOnly
          ? `opacity 0.6s ease-out ${delay}s`
          : `opacity 0.6s ease-out ${delay}s, transform 0.6s ease-out ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

/* ───────────────────────── COUNTING ANIMATION ───────────────────────── */

function CountUp({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const duration = 1500;
    const steps = 40;
    const increment = value / steps;
    let current = 0;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      // ease-out: fast start, slow end
      const progress = 1 - Math.pow(1 - step / steps, 3);
      current = Math.round(value * progress);
      setCount(current);
      if (step >= steps) {
        setCount(value);
        clearInterval(timer);
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [started, value]);

  return <span ref={ref}>{count}{suffix}</span>;
}

/* ───────────────────────── DATA ───────────────────────── */

const NAV_LINKS = [
  { label: "Landlords", href: "#services" },
  { label: "Properties", href: "#properties" },
  { label: "Tenants", href: "#tenants" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];

const FEATURED_PROPERTIES = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop",
    price: 950,
    title: "Modern 2 Bed Apartment",
    location: "Deansgate, Manchester",
    beds: 2,
    baths: 1,
    type: "Apartment",
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&h=600&fit=crop",
    price: 1250,
    title: "Spacious 3 Bed Semi-Detached",
    location: "Harwood, Bolton",
    beds: 3,
    baths: 2,
    type: "House",
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop",
    price: 1100,
    title: "Refurbished 2 Bed Terrace",
    location: "Tottington, Bury",
    beds: 2,
    baths: 1,
    type: "House",
  },
  {
    id: 4,
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop",
    price: 1450,
    title: "Luxury 3 Bed Detached",
    location: "Ramsbottom, Rossendale",
    beds: 3,
    baths: 2,
    type: "House",
  },
  {
    id: 5,
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop",
    price: 800,
    title: "Cosy 1 Bed Flat",
    location: "Whitefield, Bury",
    beds: 1,
    baths: 1,
    type: "Flat",
  },
  {
    id: 6,
    image: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=600&fit=crop",
    price: 1050,
    title: "Contemporary 2 Bed House",
    location: "Farnworth, Bolton",
    beds: 2,
    baths: 1,
    type: "House",
  },
];

const TESTIMONIALS = [
  {
    name: "Sarah T.",
    text: "David has been brilliant from start to finish. He found us the perfect home in Bury and made the whole process stress-free. Highly recommend McGowan Lettings!",
    rating: 5,
    date: "2 months ago",
  },
  {
    name: "James & Emma W.",
    text: "As landlords, we've been with McGowan Lettings for over 3 years. The fully managed service is excellent — David handles everything professionally and keeps us informed at every step.",
    rating: 5,
    date: "1 month ago",
  },
  {
    name: "Mohammed K.",
    text: "Fantastic service. David was always available on WhatsApp and responded quickly to any maintenance issues. A letting agent that actually cares about their tenants.",
    rating: 5,
    date: "3 weeks ago",
  },
];

const AREAS: { name: string; neighbourhoods: string[]; main?: boolean }[] = [
  { name: "Bury", neighbourhoods: ["Tottington", "Ramsbottom", "Whitefield", "Radcliffe", "Prestwich"], main: true },
  { name: "Bolton", neighbourhoods: ["Farnworth", "Harwood", "Horwich", "Westhoughton", "Lostock"] },
  { name: "Manchester", neighbourhoods: ["Deansgate", "Ancoats", "Salford", "Eccles", "Chorlton"] },
  { name: "Rossendale", neighbourhoods: ["Rawtenstall", "Haslingden", "Bacup", "Waterfoot"] },
  { name: "Accrington", neighbourhoods: ["Great Harwood", "Clayton-le-Moors", "Oswaldtwistle", "Rishton"] },
];

const STATS = [
  { value: 250, suffix: "+", label: "Properties Managed" },
  { value: 25, suffix: "+", label: "Years Experience" },
  { value: 5, suffix: "", label: "Areas Covered" },
  { value: 98, suffix: "%", label: "Tenant Satisfaction" },
];

/* ───────────────────────── ICONS ───────────────────────── */

function BedIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v11m0-4h18m0 0V8a1 1 0 00-1-1H8a1 1 0 00-1 1v3m11 3v4M3 18v-4m4-7v3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 10a2 2 0 114 0H5z" />
    </svg>
  );
}

function BathIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13h18v2a4 4 0 01-4 4H7a4 4 0 01-4-4v-2zm3-8v5m0-5a2 2 0 012-2h1a2 2 0 012 2v1" />
    </svg>
  );
}

function StarIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

function PhoneIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
    </svg>
  );
}

function MailIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
    </svg>
  );
}

function MapPinIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
  );
}

function ChevronDownIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

function SearchIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  );
}

function WhatsAppIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function MenuIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
  );
}

function CloseIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function ArrowRightIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
  );
}

function ShieldIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  );
}

function CheckIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

function KeyIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
    </svg>
  );
}

function BuildingIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
    </svg>
  );
}

/* ───────────────────────── LOGO COMPONENT ───────────────────────── */

function Logo() {
  return (
    <a href="/" className="block">
      <Image
        src="/mcgowan-logo.png"
        alt="McGowan Residential Lettings Ltd."
        width={1709}
        height={462}
        className="h-10 w-auto"
        priority
      />
    </a>
  );
}

/* ───────────────────────── LOGO ROW ───────────────────────── */

const LOGOS = [
  { src: "/logos/tds.svg", alt: "Tenancy Deposit Scheme", cls: "h-14 md:h-16" },
  { src: "/logos/safeagent.svg", alt: "SafeAgent", cls: "h-12 md:h-14" },
  { src: "/logos/tpo.svg", alt: "The Property Ombudsman", cls: "h-14 md:h-16" },
  { src: "/logos/tsi.png", alt: "CTSI Approved Code", cls: "h-16 md:h-20" },
  { src: "/logos/zoopla.svg", alt: "Zoopla", cls: "h-10 md:h-12" },
  { src: "/logos/primelocation2.png", alt: "PrimeLocation", cls: "h-12 md:h-14" },
];

function LogoRow() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="grid grid-cols-3 md:grid-cols-6">
      {LOGOS.map((logo, i) => (
        <div
          key={logo.alt}
          className="flex items-center justify-center p-4 md:p-6"
          style={{
            opacity: visible ? 1 : 0,
            transition: `opacity 0.5s ease-out ${i * 0.15}s`,
          }}
        >
          <Image
            src={logo.src}
            alt={logo.alt}
            width={200}
            height={80}
            className={`${logo.cls} w-auto max-w-full object-contain`}
          />
        </div>
      ))}
    </div>
  );
}

/* ───────────────────────── MAIN PAGE ───────────────────────── */

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* ─── NAVIGATION ─── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-dark/95 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Logo />

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm text-white/70 hover:text-white transition-colors duration-200 tracking-wide"
              >
                {link.label}
              </a>
            ))}
            <a
              href="#valuation"
              className="text-sm font-semibold bg-brand text-dark px-5 py-2 rounded-sm hover:bg-brand-light transition-colors duration-200"
            >
              Free Valuation
            </a>
          </nav>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-white p-2"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>

        {/* Mobile nav dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-dark border-t border-white/10 animate-slide-down">
            <nav className="px-6 py-4 flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-white/70 hover:text-white py-3 border-b border-white/5 text-sm tracking-wide transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <a
                href="#valuation"
                onClick={() => setMobileMenuOpen(false)}
                className="mt-3 text-center text-sm font-semibold bg-brand text-dark px-5 py-3 rounded-sm"
              >
                Free Valuation
              </a>
            </nav>
          </div>
        )}
      </header>

      <main>
        {/* ─── HERO ─── */}
        <section className="relative min-h-[90vh] md:min-h-screen flex items-center justify-center overflow-hidden noise-overlay">
          {/* Background image */}
          <div className="absolute inset-0">
            <Image
              src="/hero.jpg"
              alt="Manchester skyline"
              fill
              sizes="100vw"
              quality={85}
              className="object-cover object-bottom"
              priority
            />
            {/* Dark gradient overlay */}
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
                {/* Area */}
                <div className="relative">
                  <label className="text-white/40 text-xs font-medium uppercase tracking-wider mb-1.5 block">
                    Area
                  </label>
                  <div className="relative">
                    <select className="w-full bg-white/10 border border-white/10 rounded-md text-white text-sm px-3 py-2.5 appearance-none cursor-pointer focus:outline-none focus:border-brand/50 transition-colors">
                      <option value="">All Areas</option>
                      <option>Bury</option>
                      <option>Bolton</option>
                      <option>Manchester</option>
                      <option>Rossendale</option>
                      <option>Accrington</option>
                    </select>
                    <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40 pointer-events-none" />
                  </div>
                </div>

                {/* Price Range */}
                <div className="relative">
                  <label className="text-white/40 text-xs font-medium uppercase tracking-wider mb-1.5 block">
                    Max Price
                  </label>
                  <div className="relative">
                    <select className="w-full bg-white/10 border border-white/10 rounded-md text-white text-sm px-3 py-2.5 appearance-none cursor-pointer focus:outline-none focus:border-brand/50 transition-colors">
                      <option value="">Any Price</option>
                      <option>£500 pcm</option>
                      <option>£750 pcm</option>
                      <option>£1,000 pcm</option>
                      <option>£1,250 pcm</option>
                      <option>£1,500 pcm</option>
                      <option>£2,000+ pcm</option>
                    </select>
                    <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40 pointer-events-none" />
                  </div>
                </div>

                {/* Bedrooms */}
                <div className="relative">
                  <label className="text-white/40 text-xs font-medium uppercase tracking-wider mb-1.5 block">
                    Bedrooms
                  </label>
                  <div className="relative">
                    <select className="w-full bg-white/10 border border-white/10 rounded-md text-white text-sm px-3 py-2.5 appearance-none cursor-pointer focus:outline-none focus:border-brand/50 transition-colors">
                      <option value="">Any</option>
                      <option>1+</option>
                      <option>2+</option>
                      <option>3+</option>
                      <option>4+</option>
                    </select>
                    <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40 pointer-events-none" />
                  </div>
                </div>

                {/* Property Type */}
                <div className="relative">
                  <label className="text-white/40 text-xs font-medium uppercase tracking-wider mb-1.5 block">
                    Type
                  </label>
                  <div className="relative">
                    <select className="w-full bg-white/10 border border-white/10 rounded-md text-white text-sm px-3 py-2.5 appearance-none cursor-pointer focus:outline-none focus:border-brand/50 transition-colors">
                      <option value="">All Types</option>
                      <option>House</option>
                      <option>Apartment</option>
                      <option>Flat</option>
                      <option>Bungalow</option>
                    </select>
                    <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40 pointer-events-none" />
                  </div>
                </div>

                {/* Search button */}
                <div className="flex items-end">
                  <button className="w-full bg-brand hover:bg-brand-light text-dark font-semibold py-2.5 px-6 rounded-md flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer">
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
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
        <section id="services" className="bg-cream py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-6">
            {/* Section header */}
            <AnimateIn className="max-w-2xl mb-16">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-px bg-brand" />
                <span className="text-brand text-xs font-semibold tracking-[0.15em] uppercase">
                  Our Services
                </span>
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
              <div className="bg-white rounded-lg p-8 md:p-10 border border-black/5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group cursor-pointer relative overflow-hidden">
                <div className="absolute top-0 left-0 h-[3px] w-0 bg-brand group-hover:w-full transition-all duration-500 ease-out" />
                <div>
                  <div className="w-12 h-12 bg-brand/10 rounded-lg flex items-center justify-center mb-6">
                    <ShieldIcon className="w-6 h-6 text-brand-dark" />
                  </div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-heading text-2xl font-semibold text-dark">Fully Managed</h3>
                    <span className="text-[10px] font-semibold bg-brand/10 text-brand-dark px-2 py-0.5 rounded tracking-wider uppercase">
                      Popular
                    </span>
                  </div>
                  <p className="text-text-muted mb-6 leading-relaxed">
                    Sit back while we handle everything — from finding tenants to managing
                    maintenance, rent collection, and legal compliance.
                  </p>
                  <ul className="space-y-3 mb-8">
                    {[
                      "Professional marketing & tenant sourcing",
                      "Comprehensive referencing & right-to-rent checks",
                      "Monthly rent collection & statements",
                      "24/7 maintenance coordination",
                      "Routine property inspections",
                      "End-of-tenancy management & deposit returns",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-sm text-text-muted">
                        <CheckIcon className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <a
                    href="#contact"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-dark group/link"
                  >
                    Get a free quote
                    <ArrowRightIcon className="w-3.5 h-3.5 group-hover/link:translate-x-1 transition-transform" />
                  </a>
                </div>
              </div>

              {/* Let Only */}
              <div className="bg-white rounded-lg p-8 md:p-10 border border-black/5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group cursor-pointer relative overflow-hidden">
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
                      "Professional property photography",
                      "Listing on Zoopla & PrimeLocation",
                      "Accompanied viewings",
                      "Full tenant referencing",
                      "Tenancy agreement preparation",
                      "Deposit registration with TDS",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-sm text-text-muted">
                        <CheckIcon className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <a
                    href="#contact"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-dark group/link"
                  >
                    Get a free quote
                    <ArrowRightIcon className="w-3.5 h-3.5 group-hover/link:translate-x-1 transition-transform" />
                  </a>
                </div>
              </div>
            </AnimateIn>
          </div>
        </section>

        {/* ─── FEATURED PROPERTIES ─── */}
        <section id="properties" className="bg-white py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-6">
            <AnimateIn className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-px bg-brand" />
                  <span className="text-brand text-xs font-semibold tracking-[0.15em] uppercase">
                    Featured Listings
                  </span>
                </div>
                <h2 className="font-heading text-3xl md:text-4xl font-semibold text-dark leading-tight">
                  Available Properties
                </h2>
              </div>
              <a
                href="/properties"
                className="inline-flex items-center gap-2 text-sm font-semibold text-dark border border-dark/20 px-5 py-2.5 rounded-sm hover:bg-dark hover:text-white transition-all duration-200"
              >
                View All Properties
                <ArrowRightIcon className="w-3.5 h-3.5" />
              </a>
            </AnimateIn>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {FEATURED_PROPERTIES.map((property, i) => (
                <AnimateIn key={property.id} delay={i * 0.1}>
                <article
                  className="property-card group bg-white rounded-lg border border-black/5 overflow-hidden transition-all duration-300 cursor-pointer"
                >
                  {/* Image */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-warm-grey">
                    <Image
                      src={property.image}
                      alt={property.title}
                      fill
                      className="property-image object-cover transition-transform duration-700 ease-out"
                    />
                    {/* Price tag */}
                    <div className="absolute bottom-3 left-3 bg-dark/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-sm">
                      <span className="text-lg font-semibold">£{property.price.toLocaleString()}</span>
                      <span className="text-white/50 text-xs ml-1">pcm</span>
                    </div>
                    {/* Type badge */}
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-dark text-xs font-medium px-2.5 py-1 rounded-sm">
                      {property.type}
                    </div>
                  </div>
                  {/* Details */}
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
                </AnimateIn>
              ))}
            </div>
          </div>
        </section>

        {/* ─── TESTIMONIALS ─── */}
        <section className="bg-cream py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-6">
            <AnimateIn className="text-center max-w-2xl mx-auto mb-16">
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="w-8 h-px bg-brand" />
                <span className="text-brand text-xs font-semibold tracking-[0.15em] uppercase">
                  Testimonials
                </span>
                <div className="w-8 h-px bg-brand" />
              </div>
              <h2 className="font-heading text-3xl md:text-4xl font-semibold text-dark leading-tight mb-4">
                What Our Clients Say
              </h2>
              <div className="flex items-center justify-center gap-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <StarIcon key={i} className="w-5 h-5 text-amber-400" />
                ))}
              </div>
              <p className="text-text-muted text-sm mb-3">
                Rated 5 stars on Google Reviews
              </p>
              <a
                href="https://search.google.com/local/writereview?placeid=ChIJ7-uGq-eke0gRBKbenjpoV4E"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold text-brand-dark border border-brand/30 px-5 py-2 rounded-sm hover:bg-brand/10 transition-all duration-200"
              >
                Leave Us a Review
                <ArrowRightIcon className="w-3.5 h-3.5" />
              </a>
            </AnimateIn>

            <div className="grid md:grid-cols-3 gap-6">
              {TESTIMONIALS.map((testimonial, i) => (
                <AnimateIn key={i} delay={i * 0.1}>
                <div
                  className="bg-white rounded-lg p-8 border border-black/5 relative"
                >
                  {/* Quote mark */}
                  <div className="text-brand/20 text-6xl font-heading leading-none absolute top-4 right-6">
                    &ldquo;
                  </div>
                  <div className="relative">
                    <div className="flex items-center gap-0.5 mb-4">
                      {[...Array(testimonial.rating)].map((_, j) => (
                        <StarIcon key={j} className="w-4 h-4 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-dark/80 text-sm leading-relaxed mb-6">
                      {testimonial.text}
                    </p>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-dark text-sm">{testimonial.name}</div>
                        <div className="text-text-light text-xs">{testimonial.date}</div>
                      </div>
                      {/* Google icon */}
                      <div className="text-xs text-text-light flex items-center gap-1">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        Google
                      </div>
                    </div>
                  </div>
                </div>
                </AnimateIn>
              ))}
            </div>
          </div>
        </section>

        {/* ─── ABOUT / WHY CHOOSE US ─── */}
        <section id="about" className="bg-white py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Text side */}
              <AnimateIn>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-px bg-brand" />
                  <span className="text-brand text-xs font-semibold tracking-[0.15em] uppercase">
                    About McGowan Lettings
                  </span>
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
                  <a
                    href="#contact"
                    className="inline-flex items-center justify-center gap-2 bg-brand text-dark font-semibold px-6 py-3 rounded-sm hover:bg-brand-light transition-all duration-200 text-sm"
                  >
                    Get in Touch
                    <ArrowRightIcon className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href="#services"
                    className="inline-flex items-center justify-center gap-2 border border-dark/20 text-dark font-semibold px-6 py-3 rounded-sm hover:bg-dark hover:text-white transition-all duration-200 text-sm"
                  >
                    Our Services
                  </a>
                </div>
              </AnimateIn>

              {/* Image / visual side */}
              <AnimateIn delay={0.2} className="relative mb-8 lg:mb-0">
                <div className="aspect-[3/4] md:aspect-[4/5] rounded-lg overflow-hidden relative">
                  <Image
                    src="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=1000&fit=crop"
                    alt="Modern property interior"
                    fill
                    className="object-cover"
                  />
                </div>
                {/* Accent card overlay */}
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
          {/* Subtle background pattern */}
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
                <span className="text-brand text-xs font-semibold tracking-[0.15em] uppercase">
                  Areas We Cover
                </span>
                <div className="w-8 h-px bg-brand" />
              </div>
              <h2 className="font-heading text-3xl md:text-4xl font-semibold text-white leading-tight mb-4">
                Across Greater Manchester
              </h2>
              <p className="text-white/50 leading-relaxed">
                From our home base in Bury across Bolton, Manchester,
                Rossendale &amp; beyond — we know these areas inside out.
                We&apos;ll cover most areas if the property is in good order.
              </p>
            </AnimateIn>

            <div className="flex flex-wrap justify-center gap-6 max-w-5xl mx-auto [&>*]:w-full [&>*]:sm:w-[calc(50%-12px)] [&>*]:lg:w-[calc(33.333%-16px)]">
              {AREAS.map((area, i) => (
                <AnimateIn key={area.name} delay={i * 0.1}>
                <div
                  key={area.name}
                  className="bg-white/5 border border-white/10 rounded-lg p-6 hover:bg-white/10 hover:border-brand/20 transition-all duration-300 group"
                >
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
        <section id="tenants" className="bg-cream py-16 md:py-24">
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
                  <span className="text-brand text-xs font-semibold tracking-[0.15em] uppercase">
                    For Tenants
                  </span>
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
                <div className="space-y-4">
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
              </div>
            </div>
          </div>
        </section>

        {/* ─── ACCREDITATIONS ─── */}
        <section className="bg-warm-grey py-16">
          <div className="max-w-7xl mx-auto px-6">
            <AnimateIn className="text-center mb-12">
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="w-8 h-px bg-brand" />
                <span className="text-brand text-xs font-semibold tracking-[0.15em] uppercase">
                  Accredited & Featured On
                </span>
                <div className="w-8 h-px bg-brand" />
              </div>
              <p className="text-text-muted text-sm">
                Fully regulated and listed on the UK's leading property portals
              </p>
            </AnimateIn>
            <LogoRow />
          </div>
        </section>

        {/* ─── FREE VALUATION CTA ─── */}
        <section id="valuation" className="relative py-16 md:py-24 overflow-hidden">
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
              <a
                href="#contact"
                className="bg-dark text-white font-semibold px-8 py-3.5 rounded-sm hover:bg-dark-soft transition-colors duration-200 text-sm flex items-center gap-2"
              >
                Request Free Valuation
                <ArrowRightIcon className="w-3.5 h-3.5" />
              </a>
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

        {/* ─── CONTACT ─── */}
        <section id="contact" className="bg-cream py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-16">
              {/* Contact info */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-px bg-brand" />
                  <span className="text-brand text-xs font-semibold tracking-[0.15em] uppercase">
                    Get in Touch
                  </span>
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
                    { icon: PhoneIcon, label: "Phone", value: "0161 797 6967" },
                    { icon: WhatsAppIcon, label: "WhatsApp", value: "+44 7457 428720" },
                    { icon: MailIcon, label: "Email", value: "info@mcgowanlettings.co.uk" },
                    { icon: MapPinIcon, label: "Office", value: "PO Box 546, Bury, BL8 9HB" },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-brand/10 rounded-lg flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-brand-dark" />
                      </div>
                      <div>
                        <div className="font-semibold text-dark text-sm mb-0.5">{label}</div>
                        <div className="text-text-muted text-sm">{value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contact form */}
              <div className="bg-white rounded-lg p-6 sm:p-8 md:p-10 border border-black/5 shadow-sm">
                <h3 className="font-heading text-xl font-semibold text-dark mb-6">Send a Message</h3>
                <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">
                        Name
                      </label>
                      <input
                        type="text"
                        className="w-full border border-black/10 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-colors bg-white"
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">
                        Phone
                      </label>
                      <input
                        type="tel"
                        className="w-full border border-black/10 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-colors bg-white"
                        placeholder="Your number"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">
                      Email
                    </label>
                    <input
                      type="email"
                      className="w-full border border-black/10 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-colors bg-white"
                      placeholder="your@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">
                      I am a...
                    </label>
                    <div className="relative">
                      <select className="w-full border border-black/10 rounded-md px-4 py-2.5 text-sm appearance-none cursor-pointer focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-colors bg-white">
                        <option>Tenant looking for a property</option>
                        <option>Landlord seeking management</option>
                        <option>Landlord requesting a valuation</option>
                        <option>Other enquiry</option>
                      </select>
                      <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-light pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">
                      Message
                    </label>
                    <textarea
                      rows={4}
                      className="w-full border border-black/10 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-colors bg-white resize-none"
                      placeholder="Tell us how we can help..."
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-brand hover:bg-brand-light text-dark font-semibold py-3 rounded-md transition-all duration-200 text-sm "
                  >
                    Send Message
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ─── FOOTER ─── */}
      <footer className="bg-dark pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr] gap-x-8 gap-y-10 pb-12 border-b border-white/10">
            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              <Logo />
              <p className="text-white/40 text-sm mt-4 leading-relaxed max-w-xs">
                Professional letting agents based in Bury, covering Bolton, Manchester,
                Rossendale &amp; beyond. Trusted by landlords and tenants for over 25 years.
              </p>
            </div>

            {/* Quick links */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Quick Links</h4>
              <ul className="space-y-2.5">
                {["Properties", "Landlords", "Tenants", "About Us", "Contact"].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-white/40 hover:text-white text-sm transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Areas */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Areas</h4>
              <ul className="space-y-2.5">
                {["Bury", "Bolton", "Manchester", "Rossendale", "Accrington"].map((area) => (
                  <li key={area}>
                    <a href="#" className="text-white/40 hover:text-white text-sm transition-colors">
                      {area}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Legal</h4>
              <ul className="space-y-2.5">
                {[
                  { label: "Privacy Policy", href: "#" },
                  { label: "Terms of Service", href: "#" },
                  { label: "Complaints Procedure", href: "#" },
                  { label: "TPO Certificate", href: "/certificates/tpo-certificate.pdf" },
                  { label: "CMP Certificate", href: "/certificates/cmp-certificate.pdf" },
                ].map((link) => (
                  <li key={link.label}>
                    <a href={link.href} target={link.href.endsWith(".pdf") ? "_blank" : undefined} rel={link.href.endsWith(".pdf") ? "noopener noreferrer" : undefined} className="text-white/40 hover:text-white text-sm transition-colors">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="flex flex-col items-center pt-8 gap-4 text-center">
            <p className="text-white/30 text-xs">
              &copy; {new Date().getFullYear()} McGowan Residential Lettings Ltd. All rights reserved.
            </p>
            <div className="flex items-center justify-center gap-2 text-white/30 text-xs">
              <span>Regulated by</span>
              <span className="text-white/50">TDS</span>
              <span>&middot;</span>
              <span className="text-white/50">SafeAgent</span>
              <span>&middot;</span>
              <span className="text-white/50">TPO</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ─── FLOATING WHATSAPP BUTTON ─── */}
      <a
        href="https://wa.me/447457428720"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-[#25D366] text-white w-14 h-14 rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-200"
        aria-label="Contact us on WhatsApp"
      >
        <WhatsAppIcon className="w-7 h-7" />
      </a>
    </>
  );
}
