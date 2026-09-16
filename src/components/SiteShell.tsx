"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";

export default function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) {
    return <>{children}</>;
  }

  // Hide floating WhatsApp on property detail pages — the sticky CTA bar has it
  const isPropertyDetail = /^\/properties\/[^/]+$/.test(pathname);
  // Also hide on the application form — the FAB overlaps the signature pad / submit on small phones
  const hideFab = isPropertyDetail || pathname === "/apply";

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
      <div className={isPropertyDetail ? "pb-20 lg:pb-0" : ""}>
        <Footer />
      </div>
      {!hideFab && <WhatsAppButton />}
    </>
  );
}
