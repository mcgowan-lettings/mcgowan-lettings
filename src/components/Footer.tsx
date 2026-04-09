import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-dark pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr] gap-x-8 gap-y-10 pb-12 border-b border-white/10">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="block">
              <Image
                src="/mcgowan-logo.png"
                alt="McGowan Residential Lettings Ltd."
                width={1709}
                height={462}
                className="h-10 w-auto"
              />
            </Link>
            <p className="text-white/40 text-sm mt-4 leading-relaxed max-w-xs">
              Professional letting agents based in Bury, covering Bolton, Manchester,
              Rossendale, Accrington, Burnley &amp; beyond. Trusted by landlords and tenants for over 25 years.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Quick Links</h4>
            <ul className="space-y-2.5">
              {[
                { label: "Properties", href: "/properties" },
                { label: "Landlords", href: "/landlords" },
                { label: "Tenants", href: "/tenants" },
                { label: "Contact", href: "/contact" },
              ].map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-white/40 hover:text-white text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Areas */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Areas</h4>
            <ul className="space-y-2.5">
              {[
                { name: "Bury", slug: "bury" },
                { name: "Bolton", slug: "bolton" },
                { name: "Manchester", slug: "manchester" },
                { name: "Rossendale", slug: "rossendale" },
                { name: "Accrington", slug: "accrington" },
                { name: "Burnley", slug: "burnley" },
              ].map((area) => (
                <li key={area.slug}>
                  <Link href={`/areas/${area.slug}`} className="text-white/40 hover:text-white text-sm transition-colors">
                    {area.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Legal</h4>
            <ul className="space-y-2.5">
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
                    className="text-white/40 hover:text-white text-sm transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-center pt-8 gap-4 text-center">
          <p className="text-white/30 text-xs">
            &copy; {new Date().getFullYear()} McGowan Residential Lettings Ltd. All rights reserved.
          </p>
          <div className="flex items-center justify-center gap-2 text-white/30 text-xs">
            <span>Regulated by</span>
            <a href="https://www.tenancydepositscheme.com" target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-white transition-colors">TDS</a>
            <span className="text-white/40">•</span>
            <a href="https://safeagents.co.uk" target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-white transition-colors">SafeAgent</a>
            <span className="text-white/40">•</span>
            <a href="https://www.tpos.co.uk" target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-white transition-colors">TPO</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
