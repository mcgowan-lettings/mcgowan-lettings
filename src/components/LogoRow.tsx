"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

const LOGOS = [
  { src: "/logos/tds.svg", alt: "Tenancy Deposit Scheme", cls: "h-16 md:h-16" },
  { src: "/logos/safeagent.svg", alt: "SafeAgent", cls: "h-14 md:h-14" },
  { src: "/logos/tpo.svg", alt: "The Property Ombudsman", cls: "h-16 md:h-16" },
  { src: "/logos/tsi.png", alt: "CTSI Approved Code", cls: "h-20 md:h-20" },
  { src: "/logos/zoopla.svg", alt: "Zoopla", cls: "h-12 md:h-12" },
  { src: "/logos/primelocation2.png", alt: "PrimeLocation", cls: "h-14 md:h-14" },
];

type LogoState = "show" | "hide" | "animate";

export default function LogoRow() {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<LogoState>("show");

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight) return;

    let cancelled = false;
    const animate = () => {
      if (!cancelled) setState("animate");
    };

    // Wire up reveal mechanisms before hiding. See AnimateIn.tsx for the
    // full rationale on why we drop the 1.2s timer (it short-circuited
    // scroll-reveal) and rely on `pageshow` for bfcache safety instead.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          animate();
          observer.unobserve(el);
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);

    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) animate();
    };
    window.addEventListener("pageshow", handlePageShow);

    setState("hide");

    return () => {
      cancelled = true;
      observer.disconnect();
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, []);

  return (
    <div ref={ref} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6">
      {LOGOS.map((logo, i) => {
        const opacity = state === "hide" ? 0 : 1;
        const transition =
          state === "animate"
            ? `opacity 0.5s ease-out ${i * 0.15}s`
            : undefined;
        return (
          <div
            key={logo.alt}
            className="flex items-center justify-center p-5 md:p-6"
            style={{ opacity, transition }}
          >
            <Image
              src={logo.src}
              alt={logo.alt}
              width={200}
              height={80}
              className={`${logo.cls} w-auto max-w-full object-contain`}
            />
          </div>
        );
      })}
    </div>
  );
}
