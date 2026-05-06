"use client";

import { type ReactNode } from "react";

/**
 * StaggerGrid — fade-and-rise entrance for a list of children, each delayed
 * by `staggerMs` from the previous item.
 *
 * Implementation matches AnimateIn: pure CSS animation, no IntersectionObserver,
 * no JS state machine. See the long-form safety note at the top of AnimateIn.tsx
 * for the full rationale (short version: avoiding the iPad blank-page failure
 * mode that the IO-based pattern can fall into).
 *
 * Trade-off: items are animated immediately on mount, so a long grid that's
 * far below the fold will have finished its stagger animation before the user
 * scrolls to it. They appear in their final visible state.
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
  return (
    <div className={className}>
      {Array.isArray(children)
        ? children.map((child, i) => (
            <div
              key={i}
              style={{
                animation: `fadeInUp 0.5s ease-out ${i * staggerMs}ms both`,
              }}
            >
              {child}
            </div>
          ))
        : children}
    </div>
  );
}
