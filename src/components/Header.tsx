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
        <Link href="/" className="block">
          <Image
            src="/mcgowan-logo.png"
            alt="McGowan Residential Lettings Ltd."
            width={1709}
            height={462}
            className="h-10 w-auto"
            priority
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
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
          className="md:hidden text-white min-h-11 min-w-11 inline-flex items-center justify-center"
          aria-label="Toggle menu"
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-nav"
        >
          {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>

      {/* Mobile nav dropdown */}
      {mobileMenuOpen && (
        <div id="mobile-nav" className="md:hidden bg-dark border-t border-white/10 animate-slide-down">
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
