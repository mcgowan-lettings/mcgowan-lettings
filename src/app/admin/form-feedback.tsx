"use client";

import { useCallback, useEffect, useRef, useState, type Ref } from "react";

/**
 * Save-result messages render at the top of long admin forms, far from the
 * Save button. `reveal()` scrolls the message container into view after a
 * save (success or failure) so a failed save never looks like success on an
 * iPad. Does nothing if no message is showing (e.g. a cancelled confirm).
 */
export function useRevealMessages<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (tick === 0) return;
    const el = ref.current;
    if (!el || el.childElementCount === 0) return;
    const reduce =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
  }, [tick]);
  const reveal = useCallback(() => setTick((t) => t + 1), []);
  return { ref, reveal };
}

/**
 * One auto-clear timer per message. Scheduling again replaces this message's
 * previous timer only, so a success timer can never clear another action's
 * error. Use it for success messages only — errors stay until replaced.
 */
export function useAutoClear() {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );
  const schedule = useCallback((clear: () => void, ms = 3000) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      timer.current = null;
      clear();
    }, ms);
  }, []);
  const cancel = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);
  return { schedule, cancel };
}

/** Error / notice / success banners for an admin form, with live-region roles. */
export function FormMessages({
  ref,
  error,
  notice,
  success,
}: {
  ref?: Ref<HTMLDivElement>;
  error?: string;
  notice?: string;
  success?: string;
}) {
  return (
    <div ref={ref}>
      {error && (
        <div role="alert" className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {notice && (
        <div role="status" className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {notice}
        </div>
      )}
      {success && (
        <div role="status" className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}
    </div>
  );
}
