"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

/**
 * Branching strategy
 * ------------------
 * The original IntersectionObserver-based scroll-reveal pattern caused
 * permanently-invisible content on iPad/Safari (bfcache restore + hydration
 * glitches — see commits 07957b3 and c64bdcc). Desktop Chrome/Firefox/Edge
 * never had this problem.
 *
 * So we branch:
 *
 *   Safari path (iPad, iPhone, macOS Safari, anything we can't positively
 *   identify as a non-Safari engine): pure CSS animation baked into the
 *   inline style. The browser handles it; React state never hides the
 *   element. Above-fold animates on load; below-fold animates offscreen.
 *   No scroll-reveal, but no failure mode that can leave content invisible.
 *
 *   Non-Safari path (Chrome, Firefox, Edge, Opera, and their variants):
 *   above-fold elements keep the SSR-baked CSS animation, while below-fold
 *   elements switch into the rich IntersectionObserver scroll-reveal pattern
 *   on mount, with a 1.2s safety-net timer that always animates eventually.
 *
 * Detection is conservative: we only switch to the rich path when we can
 * positively identify a non-Safari engine. Anything ambiguous falls into
 * the safe Safari path. False positives degrade to "no scroll-reveal";
 * only false negatives could re-expose the iPad bug, and those would
 * require Chrome to spoof its UA — extremely unlikely.
 */
function canUseScrollReveal(): boolean {
  if (typeof navigator === "undefined") return false;
  if (typeof IntersectionObserver === "undefined") return false;
  const ua = navigator.userAgent;

  // iOS and iPadOS — every browser on these platforms is a UI shell over
  // WebKit, so iOS Chrome / Firefox / Edge share the same bfcache risk
  // profile as Safari. Stay on the safe CSS-only path regardless of which
  // browser the user picked. Catches iPadOS in "Request Desktop Site" mode
  // by checking for touch support on what claims to be a Mac.
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (/Macintosh/.test(ua) &&
      typeof document !== "undefined" &&
      "ontouchend" in document);
  if (isIOS) return false;

  // Known non-WebKit engines on desktop / Android.
  return /Chrome|Edg|EdgA|Firefox|OPR/.test(ua);
}

type AnimState = "css-load" | "hidden" | "io-animate";

/**
 * AnimateIn — fade-and-rise entrance animation for any block of content.
 *
 * SSR always renders the element with its inline CSS animation set, so the
 * Safari path needs no JS at all. On non-Safari browsers, useEffect can opt
 * the element into the IO scroll-reveal flow if it's below the fold; if any
 * step of that flow fails, the element falls back to the visible end-state
 * via the 1.2s safety-net timer.
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
  const [state, setState] = useState<AnimState>("css-load");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!canUseScrollReveal()) return; // Safari path: leave the CSS animation alone

    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight) return; // above-fold: leave the CSS animation alone

    // Below the fold on a non-Safari browser: hide the element and reveal it
    // when it scrolls into view.
    let cancelled = false;
    const hide = () => {
      if (!cancelled) setState("hidden");
    };
    const animate = () => {
      if (!cancelled) setState("io-animate");
    };
    hide();

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

    // Safety net: if the observer never fires for any reason, reveal anyway.
    const fallback = window.setTimeout(animate, 1200);

    return () => {
      cancelled = true;
      observer.disconnect();
      window.clearTimeout(fallback);
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
