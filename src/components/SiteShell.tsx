"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";

export default function SiteShell({ children, renderYear }: { children: React.ReactNode; renderYear: number }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) {
    return <>{children}</>;
  }

  // Hide the floating WhatsApp on the application forms (tenant + guarantor
  // twin) — the FAB overlaps the signature pad / submit on small phones.
  // Property pages with the sticky CTA bar hide it via CSS (globals.css,
  // `html:has(.property-sticky-bar)`), keyed on the bar actually being
  // rendered — not the URL, which also matches the property 404/error pages.
  const hideFab = pathname === "/apply" || pathname === "/guarantor";

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-full focus:bg-dark focus:px-4 focus:py-2 focus:text-white focus:text-sm focus:font-medium"
      >
        Skip to content
      </a>
      <Header />
      <main id="main" tabIndex={-1} className="flex-1 outline-none">{children}</main>
      <Footer fabClearance={!hideFab} renderYear={renderYear} />
      {!hideFab && <WhatsAppButton />}
    </>
  );
}
