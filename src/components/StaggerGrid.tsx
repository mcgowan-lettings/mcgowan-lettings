"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * StaggerGrid — same strategy as AnimateIn (see AnimateIn.tsx for full notes).
 *
 *   - SSR bakes in the CSS animation, so above-fold grids animate on load
 *     and a hydration failure cannot leave content invisible.
 *   - Below-fold grids hide on mount, then animate each child with its
 *     stagger delay when the grid scrolls into view.
 *   - The original iPad bfcache failure mode is covered by a `pageshow`
 *     handler that forces visible on `event.persisted=true`. We deliberately
 *     do NOT use a fixed-duration timer fallback — that would short-circuit
 *     scroll-reveal by auto-firing every below-fold animation after N
 *     seconds regardless of scroll position.
 */

type StaggerState = "css-load" | "hidden" | "io-animate";

export function StaggerGrid({
  children,
  className = "",
  staggerMs = 80,
}: {
  children: ReactNode;
  className?: string;
  staggerMs?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<StaggerState>("css-load");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") return;

    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight) return;

    let cancelled = false;
    const animate = () => {
      if (!cancelled) setState("io-animate");
    };

    // Wire up reveal mechanisms before hiding — see AnimateIn.tsx.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          animate();
          observer.unobserve(el);
        }
      },
      { threshold: 0.05 }
    );
    observer.observe(el);

    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) animate();
    };
    window.addEventListener("pageshow", handlePageShow);

    setState("hidden");

    return () => {
      cancelled = true;
      observer.disconnect();
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, []);

  const items = Array.isArray(children) ? children : null;

  if (!items) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }

  return (
    <div ref={ref} className={className}>
      {items.map((child, i) => {
        const delayMs = i * staggerMs;
        let style: React.CSSProperties;

        if (state === "hidden") {
          style = { opacity: 0, transform: "translateY(24px)" };
        } else if (state === "io-animate") {
          style = { animation: `fadeInUp 0.5s ease-out ${delayMs}ms both` };
        } else {
          // css-load: SSR-baked animation that runs on first paint.
          style = { animation: `fadeInUp 0.5s ease-out ${delayMs}ms both` };
        }

        return (
          <div key={i} style={style}>
            {child}
          </div>
        );
      })}
    </div>
  );
}
