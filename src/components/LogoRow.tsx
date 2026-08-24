"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

const LOGOS = [
  { src: "/logos/tds.svg", alt: "Tenancy Deposit Scheme", cls: "h-16 md:h-16" },
  { src: "/logos/safeagent.svg", alt: "SafeAgent", cls: "h-14 md:h-14" },
  { src: "/logos/tpo.svg", alt: "The Property Ombudsman", cls: "h-16 md:h-16" },
  { src: "/logos/zoopla.svg", alt: "Zoopla", cls: "h-12 md:h-12" },
  { src: "/logos/primelocation2.png", alt: "PrimeLocation", cls: "h-14 md:h-14" },
];

/**
 * LogoRow — accreditation badges with a staggered fade-in on scroll.
 *
 * Same imperative-ref strategy as AnimateIn (see that file for the full
 * rationale). SSR renders every logo visible. Below-fold, the effect hides
 * each logo via `el.style.opacity = "0"`, then fades them back in with a
 * per-logo transition delay on intersect or `pageshow`. No React state,
 * so the React 19 cascading-render warning doesn't fire and there's no
 * iPad bfcache failure mode to worry about.
 */
export default function LogoRow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight) return;

    let cancelled = false;
    const childArr = Array.from(el.children) as HTMLElement[];

    const reveal = () => {
      if (cancelled) return;
      childArr.forEach((child, i) => {
        child.style.transition = `opacity 0.5s ease-out ${i * 0.15}s`;
        child.style.opacity = "1";
      });
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          reveal();
          observer.unobserve(el);
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);

    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) reveal();
    };
    window.addEventListener("pageshow", handlePageShow);

    // Hide imperatively after the reveal mechanisms are wired. Any setup
    // failure leaves the logos visible (the SSR default).
    childArr.forEach((child) => {
      child.style.opacity = "0";
    });

    return () => {
      cancelled = true;
      observer.disconnect();
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, []);

  return (
    <div ref={ref} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6">
      {LOGOS.map((logo) => (
        <div
          key={logo.alt}
          className="flex items-center justify-center p-5 md:p-6"
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
