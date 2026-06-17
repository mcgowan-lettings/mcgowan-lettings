"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * StaggerGrid — same imperative-ref strategy as AnimateIn (see that file
 * for the full rationale).
 *
 *   - SSR bakes each child's CSS animation with a per-index stagger delay,
 *     so above-fold grids animate on first paint and a hydration failure
 *     can never leave content invisible.
 *   - Below-fold grids: the effect imperatively hides each child via
 *     `el.style.opacity = "0"`, then re-triggers the staggered animation
 *     when the grid scrolls into view (or on `pageshow` bfcache restore).
 *   - No React state for the visual pipeline, so we never trip the React 19
 *     cascading-render warning, and the iPad bfcache failure mode is moot.
 *   - A 1.5s `setTimeout` failsafe force-reveals if IO never fires at all
 *     (observed on iPad Safari after client-side navigation), so the grid
 *     can never be stuck invisible. `reveal()` is idempotent.
 */

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

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") return;

    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight) return;

    let cancelled = false;
    let revealed = false;
    const childArr = Array.from(el.children) as HTMLElement[];

    const reveal = () => {
      if (cancelled || revealed) return;
      revealed = true;
      // Re-trigger the staggered animation. Clear styles and force a reflow
      // before re-applying, so the browser actually restarts the animation
      // instead of treating it as a no-op (it was already running from SSR).
      childArr.forEach((child) => {
        child.style.animation = "none";
        child.style.opacity = "";
        child.style.transform = "";
      });
      void el.offsetWidth;
      childArr.forEach((child, i) => {
        child.style.animation = `fadeInUp 0.5s ease-out ${i * staggerMs}ms both`;
      });
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          reveal();
          observer.unobserve(el);
        }
      },
      { threshold: 0.05 }
    );
    observer.observe(el);

    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) reveal();
    };
    window.addEventListener("pageshow", handlePageShow);

    // Failsafe: if IntersectionObserver never fires (a documented iPad
    // Safari failure mode after client-side navigation), force-reveal so
    // the grid can never be stuck invisible. `reveal()` is idempotent, so
    // the scroll-triggered path still wins whenever IO works normally.
    const failsafe = setTimeout(reveal, 1500);

    // Hide each child imperatively after observers are wired. Any setup
    // failure leaves the SSR animation running (children remain visible).
    childArr.forEach((child) => {
      child.style.animation = "none";
      child.style.opacity = "0";
      child.style.transform = "translateY(24px)";
    });

    return () => {
      cancelled = true;
      clearTimeout(failsafe);
      observer.disconnect();
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [staggerMs]);

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
        // SSR-baked animation. The effect overrides this below-fold via the
        // ref; React itself never re-renders the styles.
        const style: React.CSSProperties = {
          animation: `fadeInUp 0.5s ease-out ${i * staggerMs}ms both`,
        };
        return (
          <div key={i} style={style}>
            {child}
          </div>
        );
      })}
    </div>
  );
}
