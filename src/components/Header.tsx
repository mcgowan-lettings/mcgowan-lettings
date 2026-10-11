"use client";

import { useState, useEffect, useRef } from "react";
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
  const toggleRef = useRef<HTMLButtonElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLElement>(null);
  // True when the desktop nav can't fit its row — e.g. 200% text-only zoom
  // or a large default font on a screen near the lg breakpoint. Then we
  // fall back to the hamburger instead of clipping links (WCAG 1.4.4/1.4.10).
  const [navOverflows, setNavOverflows] = useState(false);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const measure = () => {
      // Hidden below lg (display:none) → clientWidth 0; nothing to decide.
      if (nav.clientWidth === 0) return setNavOverflows(false);
      setNavOverflows(nav.scrollWidth > nav.clientWidth + 1);
    };
    measure();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }
    // Watch the nav box and each link: a text-size change grows the links
    // even when the (already clamped) nav box itself doesn't change size.
    const ro = new ResizeObserver(measure);
    ro.observe(nav);
    for (const child of Array.from(nav.children)) ro.observe(child);
    return () => ro.disconnect();
  }, []);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  // Close the menu whenever the route changes — covers the logo, back/forward
  // and any in-page link, not just the nav items. (Adjusting state during
  // render on a changed prop is React's recommended alternative to an effect.)
  const [menuPathname, setMenuPathname] = useState(pathname);
  if (menuPathname !== pathname) {
    setMenuPathname(pathname);
    setMobileMenuOpen(false);
  }

  // Close the open mobile menu on Escape and hand focus back to the toggle,
  // so keyboard users aren't dropped onto <body> when the panel unmounts.
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileMenuOpen]);

  // Close when keyboard focus leaves the header (Tab past the last menu
  // item) so the open panel never hides content the user has tabbed to.
  const handleBlur = (e: React.FocusEvent<HTMLElement>) => {
    if (!mobileMenuOpen) return;
    const next = e.relatedTarget as Node | null;
    // relatedTarget is null for clicks on non-focusable areas / window blur —
    // leave the menu as-is then (tapping the panel background must not close it).
    if (next && !headerRef.current?.contains(next)) setMobileMenuOpen(false);
  };

  return (
    <header
      ref={headerRef}
      onBlur={handleBlur}
      className="fixed top-0 left-0 right-0 z-50 bg-dark/95 backdrop-blur-md border-b border-white/5"
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
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

        {/* Desktop nav from lg: logo + 6 links + CTA need ~870px at normal
            text size. (Not xl: at a 1280px window a classic scrollbar leaves
            ~1265px of layout width, which fell below xl and hid the nav on
            Windows laptops.) At 200% text-only zoom (WCAG 1.4.4) the links
            don't fit at lg — `navOverflows` then swaps in the hamburger.
            `min-w-0` + `overflow-hidden` stop an oversized row ever widening
            the page; if the links still don't fit, `navOverflows` swaps in
            the hamburger. Right-alignment uses ml-auto on the first link (not
            justify-end) so any overflow spills to the measurable end side. */}
        <nav
          ref={navRef}
          aria-label="Main"
          className={`hidden lg:flex flex-1 items-center gap-8 min-w-0 overflow-hidden p-1 [&>:first-child]:ml-auto ${
            navOverflows ? "invisible" : ""
          }`}
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              aria-current={isActive(link.href) ? "page" : undefined}
              className={`text-sm whitespace-nowrap transition-colors duration-200 tracking-wide ${
                isActive(link.href)
                  ? "text-white font-medium"
                  : "text-white/70 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/valuation"
            aria-current={isActive("/valuation") ? "page" : undefined}
            className="text-sm whitespace-nowrap font-semibold bg-brand text-dark px-5 py-2 rounded-sm hover:bg-brand-light transition-colors duration-200"
          >
            Free Valuation
          </Link>
        </nav>

        {/* Mobile menu toggle */}
        <button
          ref={toggleRef}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className={`${navOverflows ? "" : "lg:hidden"} shrink-0 text-white min-h-11 min-w-11 inline-flex items-center justify-center`}
          aria-label="Toggle menu"
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-nav"
        >
          {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>

      {/* Mobile nav dropdown */}
      {mobileMenuOpen && (
        <div id="mobile-nav" className={`${navOverflows ? "" : "lg:hidden"} bg-dark border-t border-white/10 animate-slide-down mobile-nav-max-h overflow-y-auto overscroll-contain`}>
          <nav aria-label="Main" className="px-6 py-4 flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                aria-current={isActive(link.href) ? "page" : undefined}
                className={`py-3 border-b border-white/5 text-sm tracking-wide transition-colors ${
                  isActive(link.href)
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
              aria-current={isActive("/valuation") ? "page" : undefined}
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
