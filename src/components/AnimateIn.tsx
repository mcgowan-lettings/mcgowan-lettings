"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

/**
 * AnimateIn — fade-and-rise entrance animation for any block of content.
 *
 * Implementation is **pure CSS animation** (no IntersectionObserver, no JS
 * state machine). This is the same pattern as the hero's existing
 * `animate-fade-in-up` / `stagger-N` classes, which have been running on iPad
 * without issue since the hero was built.
 *
 * Why not IntersectionObserver-based scroll-reveal:
 * Commits 07957b3 and c64bdcc fixed an iPad blank-page bug caused by the JS-
 * driven hide-then-IO-reveal pattern. Any hydration glitch, bfcache restore,
 * content blocker, or stuck observer left content permanently invisible.
 * Pure CSS animations don't depend on React hydration, an observer firing,
 * or any JS at all — they're run by the browser's animation engine and have
 * `animation-fill-mode: both` so the element is parked at the visible
 * end-state once the animation completes.
 *
 * Trade-off:
 * Elements that are below the fold on initial page load animate while offscreen,
 * so the user doesn't see a scroll-reveal effect for them — they're already in
 * their final visible state by the time the user scrolls there. We accept this
 * in exchange for never having a permanently-invisible-content failure mode again.
 *
 * If the animation is ever skipped entirely (e.g. CSS not parsed, unsupported
 * browser), the element renders with its default styles (visible, no transform).
 */
export function AnimateIn({
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
  const style: CSSProperties = {
    animation: `${fadeOnly ? "fadeIn" : "fadeInUp"} 0.7s ease-out ${delay}s both`,
  };

  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
}

/**
 * CountUp — animates a number from 0 up to its target value when the element
 * scrolls into view.
 *
 * Safety: the initial state of `count` is the final value, so the SSR HTML
 * already renders the correct number. The animation only resets to 0 once
 * `start()` has confirmed the element is on screen (or the IntersectionObserver
 * is unavailable). If anything fails, the user simply sees the final number
 * without animation — never a blank or invisible value.
 */
export function CountUp({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [count, setCount] = useState(value);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (started) return;
    const el = ref.current;
    let cancelled = false;
    const start = () => {
      if (cancelled) return;
      setCount(0);
      setStarted(true);
    };
    if (!el || typeof IntersectionObserver === "undefined") {
      start();
      return;
    }
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight) {
      start();
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          start();
          observer.unobserve(el);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    const fallback = window.setTimeout(start, 1200);
    return () => {
      cancelled = true;
      window.clearTimeout(fallback);
      observer.disconnect();
    };
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const duration = 1500;
    const steps = 40;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = 1 - Math.pow(1 - step / steps, 3);
      const current = Math.round(value * progress);
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
