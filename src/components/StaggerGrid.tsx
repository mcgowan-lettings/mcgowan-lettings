"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Same branching strategy as AnimateIn — see AnimateIn.tsx for the full
 * rationale. Short version:
 *
 *   - Safari (any platform) and unknown browsers: pure CSS animation, baked
 *     into inline styles. The element animates on load; React state never
 *     hides it. No scroll-reveal but bullet-proof against the iPad bfcache /
 *     stuck-observer failure modes that prompted commits 07957b3 / c64bdcc.
 *
 *   - Known non-Safari engines (Chrome, Firefox, Edge, Opera, variants): use
 *     IntersectionObserver to hide the grid when below the fold and reveal
 *     each child with its stagger delay when scrolled into view. Includes a
 *     1.2s safety-net timer.
 */
function canUseScrollReveal(): boolean {
  if (typeof navigator === "undefined") return false;
  if (typeof IntersectionObserver === "undefined") return false;
  const ua = navigator.userAgent;
  // iOS / iPadOS — all browsers there are WebKit shells, so they share
  // Safari's bfcache risk. Keep them on the safe CSS-only path.
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (/Macintosh/.test(ua) &&
      typeof document !== "undefined" &&
      "ontouchend" in document);
  if (isIOS) return false;
  return /Chrome|Edg|EdgA|Firefox|OPR/.test(ua);
}

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
    if (!canUseScrollReveal()) return;

    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight) return;

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
      { threshold: 0.05 }
    );
    observer.observe(el);

    const fallback = window.setTimeout(animate, 1200);

    return () => {
      cancelled = true;
      observer.disconnect();
      window.clearTimeout(fallback);
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
