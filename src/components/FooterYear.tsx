"use client";

import { useEffect, useState } from "react";

/** Copyright year. Fully static pages are prerendered with the build year;
 * after New Year this updates to the visitor's current year on hydration
 * instead of staying stale until the next deploy. */
export default function FooterYear({ buildYear }: { buildYear: number }) {
  const [year, setYear] = useState(buildYear);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync to the client clock
    setYear(new Date().getFullYear());
  }, []);
  return <>{year}</>;
}
