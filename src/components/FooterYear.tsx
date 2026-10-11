"use client";

import { useEffect, useState } from "react";

/** Copyright year. Fully static pages are prerendered with the year at build
 * time; after New Year this corrects itself to the visitor's year once
 * hydrated, instead of staying stale until the next deploy.
 *
 * `renderYear` comes from the server (root layout) and is serialised, so the
 * first client render is identical to the server HTML — no hydration error —
 * and the effect's update is a real state change that React then paints.
 * (Computing the year in this client module would differ from the HTML and
 * React would never patch the text.) */
export default function FooterYear({ renderYear }: { renderYear: number }) {
  const [year, setYear] = useState(renderYear);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync to the client clock
    setYear(new Date().getFullYear());
  }, []);
  return <>{year}</>;
}
