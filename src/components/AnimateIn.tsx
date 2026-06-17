"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

/**
 * AnimateIn — fade-and-rise entrance animation for any block of content.
 *
 * Strategy
 * --------
 * The render pipeline always emits the element with its CSS animation set,
 * with `animation-fill-mode: both`. That makes the "above the fold" case
 * work without JS at all and means a hydration failure can never leave
 * content invisible.
 *
 * After mount, below-the-fold elements opt into scroll-reveal by mutating
 * inline styles imperatively via the ref: pause the SSR animation, hide
 * the element, then re-trigger the animation on intersect or on `pageshow`
 * (the bfcache restore path).
 *
 * Why imperative DOM and not React state
 * --------------------------------------
 * Earlier versions used `useState` to flip "css-load" → "hidden" → "io-animate"
 * synchronously inside the effect. React 19 (correctly) flags that as a
 * cascading-render anti-pattern: the visual transition has nothing to do
 * with React's data flow, so it shouldn't drive renders. Touching `el.style`
 * directly keeps the whole pipeline outside React after first paint.
 *
 * iOS / Safari notes
 * ------------------
 * The original iPad bfcache failure mode (state stuck "hidden", IO never
 * re-fires after restore) is impossible here because React state never
 * changes. We still listen for `pageshow` with `event.persisted=true` so a
 * bfcache restore force-completes the animation; it's redundant safety on
 * top of the SSR fill-mode default.
 *
 * Belt-and-braces, a `setTimeout` failsafe force-reveals after 1.5s if IO
 * never fired at all (iPad Safari has been observed to silently drop the
 * IntersectionObserver callback after a client-side navigation). `reveal()`
 * is idempotent, so this only matters when the scroll path failed — content
 * can never be left permanently invisible.
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
  const ref = useRef<HTMLDivElement>(null);
  const animationName = fadeOnly ? "fadeIn" : "fadeInUp";

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") return;

    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight) return; // above-fold: leave SSR animation alone

    let cancelled = false;
    let revealed = false;
    const reveal = () => {
      if (cancelled || revealed) return;
      revealed = true;
      // Re-trigger animation from zero. Clearing then setting is more
      // reliable than mutating in place once the browser has already
      // started the SSR-default animation.
      el.style.animation = "none";
      el.style.opacity = "";
      el.style.transform = "";
      void el.offsetWidth; // force reflow so the next assignment restarts
      el.style.animation = `${animationName} 0.7s ease-out 0s both`;
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          reveal();
          observer.unobserve(el);
        }
      },
      { threshold: 0, rootMargin: "0px 0px -10% 0px" }
    );
    observer.observe(el);

    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) reveal();
    };
    window.addEventListener("pageshow", handlePageShow);

    // Failsafe: if IntersectionObserver never fires (a documented iPad
    // Safari failure mode after client-side navigation), force-reveal so
    // content can never be stuck invisible. `reveal()` is idempotent, so
    // the scroll-triggered path still wins whenever IO works normally.
    const failsafe = setTimeout(reveal, 1500);

    // Hide imperatively, AFTER all reveal mechanisms are in place. If any
    // of the listeners errored, we'd still be visible (animation already
    // running from the SSR style).
    el.style.animation = "none";
    el.style.opacity = "0";
    if (!fadeOnly) el.style.transform = "translateY(24px)";

    return () => {
      cancelled = true;
      clearTimeout(failsafe);
      observer.disconnect();
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [animationName, fadeOnly]);

  // SSR-baked animation; React never touches `style` after first paint —
  // the effect drives all subsequent visual changes via the ref.
  const style: CSSProperties = {
    animation: `${animationName} 0.7s ease-out ${delay}s both`,
  };

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
