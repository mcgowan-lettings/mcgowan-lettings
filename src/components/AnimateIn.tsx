"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

/**
 * AnimateIn — fade-and-rise entrance animation for any block of content.
 *
 * Strategy
 * --------
 * SSR always renders the element with its CSS animation baked in. That makes
 * the "above the fold" case work without JS at all and means a hydration
 * failure can never leave content invisible.
 *
 * After mount, below-the-fold elements opt into scroll-reveal: hide via
 * inline style, then reveal when an IntersectionObserver fires. This gives
 * us the rich on-scroll feel back on every browser (including iOS), without
 * regressing the iPad blank-page bug fixed in 07957b3 / c64bdcc.
 *
 * Why this is safe on iPad / Safari
 * ---------------------------------
 * The original failure mode was: page navigates away with state="hidden",
 * gets bfcache-frozen, navigates back with state still "hidden", and the
 * IntersectionObserver doesn't re-fire (because intersection state didn't
 * change during the freeze). Result: permanently invisible content.
 *
 * We add two independent reveal mechanisms beyond the IntersectionObserver
 * itself:
 *
 *   1. A `pageshow` event handler that listens for `event.persisted=true`
 *      (i.e. bfcache restore) and forces the visible state immediately.
 *      The user has already seen the page once, so skipping the animation
 *      on bfcache is the right behaviour anyway. This is the explicit fix
 *      for the original iPad failure mode.
 *   2. The SSR-baked CSS animation with animation-fill-mode 'both' — even
 *      with no JS at all, the element ends up visible.
 *
 * (We deliberately do NOT use a fixed-duration safety-net timer. A timer
 * fires after N seconds regardless of scroll position, which short-circuits
 * the entire scroll-reveal effect for any element the user hasn't reached
 * yet. The bfcache scenario the original timer was guarding against is now
 * covered by the pageshow handler.)
 *
 * Order matters: we register the reveal mechanisms BEFORE calling
 * setState("hidden"), so any exception during setup leaves the element
 * visible.
 */

type AnimState = "css-load" | "hidden" | "io-animate";

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
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<AnimState>("css-load");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") return;

    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight) return; // above-fold: leave the CSS animation alone

    let cancelled = false;
    const animate = () => {
      if (!cancelled) setState("io-animate");
    };

    // Wire up every reveal mechanism BEFORE we hide the element, so an
    // exception during setup can't leave it stuck invisible.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          animate();
          observer.unobserve(el);
        }
      },
      { threshold: 0, rootMargin: "0px 0px -10% 0px" }
    );
    observer.observe(el);

    // bfcache safety net: if the page is restored from the back/forward
    // cache (iOS Safari, modern desktop browsers), force visible. The user
    // already saw the page on the previous visit — skipping the animation
    // is fine and protects us from the IntersectionObserver-stuck failure
    // mode that caused the original iPad blank-page bug.
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) animate();
    };
    window.addEventListener("pageshow", handlePageShow);

    // Now safe to hide — every recovery path is in place.
    setState("hidden");

    return () => {
      cancelled = true;
      observer.disconnect();
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, []);

  const animationName = fadeOnly ? "fadeIn" : "fadeInUp";
  let style: CSSProperties;

  if (state === "hidden") {
    style = {
      opacity: 0,
      transform: fadeOnly ? undefined : "translateY(24px)",
    };
  } else if (state === "io-animate") {
    style = { animation: `${animationName} 0.7s ease-out 0s both` };
  } else {
    // "css-load" — the SSR default. Animation runs on first paint via the
    // browser's own animation engine, independent of React.
    style = { animation: `${animationName} 0.7s ease-out ${delay}s both` };
  }

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
}

/**
 * CountUp — animates a number from 0 up to its target value when the element
 * scrolls into view.
 *
 * Safety: the initial state of `count` is the final value, so SSR always
 * renders the correct number. Animation only resets to 0 once `start()` has
 * confirmed the element is on screen (or IntersectionObserver is unavailable).
 * If anything fails, the user simply sees the final value without animation.
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
    // bfcache safety: if the page is restored from cache, the count is
    // already at its final value (initial state), so just mark it started
    // to short-circuit any pending observer work.
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted && !cancelled) setStarted(true);
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => {
      cancelled = true;
      observer.disconnect();
      window.removeEventListener("pageshow", handlePageShow);
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
