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

  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <div className={isPropertyDetail ? "pb-20 lg:pb-0" : ""}>
        <Footer />
      </div>
      {!isPropertyDetail && <WhatsAppButton />}
    </>
  );
}
