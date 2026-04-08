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

export default function LogoRow() {
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
          className="flex items-center justify-center p-5 md:p-6"
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
