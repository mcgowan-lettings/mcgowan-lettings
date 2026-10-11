import Image from "next/image";
import Link from "next/link";

/**
 * `fabClearance`: the WhatsApp FAB is fixed bottom-6 right-6 (56px), so it
 * covers the bottom-most ~80px of the viewport's right edge. Below `sm` the
 * centred "Regulated by … TPO" row reaches under it, so when the FAB is shown
 * pad the footer (inside the dark background) until that row clears it.
 */
export default function Footer({ fabClearance = false }: { fabClearance?: boolean }) {
  return (
    <footer className={`bg-dark pt-16 ${fabClearance ? "pb-28 sm:pb-8" : "pb-8"}`}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr] gap-x-8 gap-y-10 pb-12 border-b border-white/10">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="block">
              <Image
                src="/mcgowan-logo-header.png"
                alt="McGowan Residential Lettings Ltd."
                width={444}
                height={120}
                className="h-10 w-auto"
              />
            </Link>
            <p className="text-white/60 text-sm mt-4 leading-relaxed max-w-xs">
              Professional letting agents based in Bury, covering Bolton, Manchester,
              Rochdale, Rossendale, Accrington, Burnley &amp; beyond. Trusted by landlords and tenants for over 25 years.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h2 className="text-white font-semibold text-sm mb-2">Quick Links</h2>
            <ul>
              {[
                { label: "Properties", href: "/properties" },
                { label: "Landlords", href: "/landlords" },
                { label: "Tenants", href: "/tenants" },
                { label: "Contact", href: "/contact" },
              ].map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="inline-flex items-center min-h-11 text-white/60 hover:text-white text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Areas */}
          <div>
            <h2 className="text-white font-semibold text-sm mb-2">Areas</h2>
            <ul>
              {[
                { name: "Bury", slug: "bury" },
                { name: "Bolton", slug: "bolton" },
                { name: "Manchester", slug: "manchester" },
                { name: "Rochdale", slug: "rochdale" },
                { name: "Rossendale", slug: "rossendale" },
                { name: "Accrington", slug: "accrington" },
                { name: "Burnley", slug: "burnley" },
              ].map((area) => (
                <li key={area.slug}>
                  <Link href={`/areas/${area.slug}`} className="inline-flex items-center min-h-11 text-white/60 hover:text-white text-sm transition-colors">
                    {area.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h2 className="text-white font-semibold text-sm mb-2">Legal</h2>
            <ul>
              {[
                { label: "Privacy Policy", href: "/privacy" },
                { label: "Terms of Service", href: "/terms" },
                { label: "Complaints Procedure", href: "/complaints" },
                { label: "TPO Certificate", href: "/certificates/tpo-certificate.pdf" },
                { label: "CMP Certificate", href: "/certificates/cmp-certificate.pdf" },
              ].map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target={link.href.endsWith(".pdf") ? "_blank" : undefined}
                    rel={link.href.endsWith(".pdf") ? "noopener noreferrer" : undefined}
                    className="inline-flex items-center min-h-11 text-white/60 hover:text-white text-sm transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-center pt-8 gap-1 text-center">
          <p className="text-white/60 text-xs">
            &copy;{" "}
            {/* Prerendered pages bake in the build year; after New Year the
                client's year differs until the next rebuild. Suppress the
                benign text mismatch rather than hydrate-erroring. */}
            <span suppressHydrationWarning>{new Date().getFullYear()}</span>{" "}
            McGowan Residential Lettings Ltd. All rights reserved.
          </p>
          <p className="text-white/60 text-xs">
            McGowan Residential Lettings Ltd · Registered in England &amp; Wales, company no. 07598462
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-2 text-white/60 text-xs">
            <span>Regulated by</span>
            <a href="https://www.tenancydepositscheme.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center min-h-11 px-1 text-white/70 hover:text-white transition-colors">TDS</a>
            <span className="text-white/40">•</span>
            <a href="https://safeagents.co.uk" target="_blank" rel="noopener noreferrer" className="inline-flex items-center min-h-11 px-1 text-white/70 hover:text-white transition-colors">SafeAgent</a>
            <span className="text-white/40">•</span>
            <a href="https://www.tpos.co.uk" target="_blank" rel="noopener noreferrer" className="inline-flex items-center min-h-11 px-1 text-white/70 hover:text-white transition-colors">TPO</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
