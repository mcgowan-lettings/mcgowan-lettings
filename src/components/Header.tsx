"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MenuIcon, CloseIcon } from "./Icons";

const NAV_LINKS = [
  { label: "Properties", href: "/properties" },
  { label: "Landlords", href: "/landlords" },
  { label: "Tenants", href: "/tenants" },
  { label: "Areas", href: "/areas" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Close the menu whenever the route changes — covers the logo, back/forward
  // and any in-page link, not just the nav items. (Adjusting state during
  // render on a changed prop is React's recommended alternative to an effect.)
  const [menuPathname, setMenuPathname] = useState(pathname);
  if (menuPathname !== pathname) {
    setMenuPathname(pathname);
    setMobileMenuOpen(false);
  }

  // Close the open mobile menu on Escape
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileMenuOpen]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-dark/95 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="block shrink-0" onClick={() => setMobileMenuOpen(false)}>
          <Image
            src="/mcgowan-logo-header.png"
            alt="McGowan Residential Lettings Ltd."
            width={444}
            height={120}
            className="h-10 w-auto"
            priority
          />
        </Link>

        {/* Desktop nav — from lg only: logo + 6 links + CTA need ~870px, so at
            md (768px) the row overflowed and crushed the logo. */}
        <nav className="hidden lg:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={`text-sm transition-colors duration-200 tracking-wide ${
                pathname === link.href || pathname.startsWith(link.href + "/")
                  ? "text-white font-medium"
                  : "text-white/70 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/valuation"
            className="text-sm font-semibold bg-brand text-dark px-5 py-2 rounded-sm hover:bg-brand-light transition-colors duration-200"
          >
            Free Valuation
          </Link>
        </nav>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden text-white min-h-11 min-w-11 inline-flex items-center justify-center"
          aria-label="Toggle menu"
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-nav"
        >
          {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>

      {/* Mobile nav dropdown */}
      {mobileMenuOpen && (
        <div id="mobile-nav" className="lg:hidden bg-dark border-t border-white/10 animate-slide-down max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain">
          <nav className="px-6 py-4 flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`py-3 border-b border-white/5 text-sm tracking-wide transition-colors ${
                  pathname === link.href || pathname.startsWith(link.href + "/")
                    ? "text-white font-medium"
                    : "text-white/70 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/valuation"
              onClick={() => setMobileMenuOpen(false)}
              className="mt-3 text-center text-sm font-semibold bg-brand text-dark px-5 py-3 rounded-sm"
            >
              Free Valuation
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
