import Image from "next/image";

export default function PrivacyPage() {
  return (
    <>
      {/* ── Hero Banner ── */}
      <section className="relative h-[40vh] min-h-[280px] flex items-center overflow-hidden noise-overlay bg-dark pt-16">
        <div className="absolute inset-0">
          <Image
            src="/hero.jpg"
            alt="Greater Manchester"
            fill
            sizes="100vw"
            quality={85}
            className="object-cover object-center opacity-40"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dark/80 via-dark/40 to-dark/60" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center w-full">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-px bg-brand" />
            <span className="text-brand text-sm font-semibold tracking-[0.15em] uppercase">
              Legal
            </span>
            <div className="w-8 h-px bg-brand" />
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold text-white leading-[1.1] mb-4">
            Privacy Policy
          </h1>
          <p className="text-white/70 text-lg md:text-xl max-w-xl mx-auto">
            How we collect, use, and protect your personal data.
          </p>
        </div>
      </section>

      {/* ── Content ── */}
      <section className="bg-cream py-16 md:py-24">
        <div className="max-w-3xl mx-auto px-6">
          <div className="max-w-none">
            <p className="text-text-muted text-sm mb-10">
              Last updated: April 2026
            </p>

            <h2 className="font-heading text-2xl font-semibold text-dark mt-10 mb-4">
              1. Who We Are
            </h2>
            <p className="text-text-muted leading-relaxed mb-6">
              McGowan Residential Lettings Ltd (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is a
              letting agency based in Greater Manchester. We are committed to protecting your
              personal data and respecting your privacy.
            </p>
            <p className="text-text-muted leading-relaxed mb-6">
              <strong className="text-dark">Registered Address:</strong> PO Box 546, Bury, BL8 9HB<br />
              <strong className="text-dark">Phone:</strong> 0161 797 6967<br />
              <strong className="text-dark">Email:</strong> info@mcgowanlettings.co.uk
            </p>

            <h2 className="font-heading text-2xl font-semibold text-dark mt-10 mb-4">
              2. What Data We Collect
            </h2>
            <p className="text-text-muted leading-relaxed mb-4">
              We may collect and process the following personal data:
            </p>
            <ul className="list-disc pl-6 text-text-muted space-y-2 mb-6">
              <li>Name, email address, phone number, and postal address</li>
              <li>Enquiry details submitted through our contact forms</li>
              <li>Tenancy application information (employment details, references, identification documents)</li>
              <li>Landlord property and financial information relevant to property management</li>
              <li>Technical data such as IP address, browser type, and pages visited on our website</li>
            </ul>

            <h2 className="font-heading text-2xl font-semibold text-dark mt-10 mb-4">
              3. How We Use Your Data
            </h2>
            <p className="text-text-muted leading-relaxed mb-4">
              We use your personal data for the following purposes:
            </p>
            <ul className="list-disc pl-6 text-text-muted space-y-2 mb-6">
              <li>To respond to your enquiries and provide the services you have requested</li>
              <li>To process tenancy applications and manage tenancy agreements</li>
              <li>To manage properties on behalf of landlords</li>
              <li>To comply with our legal and regulatory obligations</li>
              <li>To improve our website and services</li>
              <li>To send you relevant communications about our services (where you have consented)</li>
            </ul>

            <h2 className="font-heading text-2xl font-semibold text-dark mt-10 mb-4">
              4. Legal Basis for Processing
            </h2>
            <p className="text-text-muted leading-relaxed mb-6">
              We process your personal data on the following legal bases under GDPR: performance
              of a contract (e.g. tenancy agreements), compliance with legal obligations (e.g.
              Right to Rent checks, deposit protection), legitimate interests (e.g. responding
              to enquiries, improving our services), and consent (e.g. marketing communications).
            </p>

            <h2 className="font-heading text-2xl font-semibold text-dark mt-10 mb-4">
              5. Data Retention
            </h2>
            <p className="text-text-muted leading-relaxed mb-6">
              We retain your personal data only for as long as is necessary for the purposes
              for which it was collected. Tenancy records are retained for six years after the
              end of a tenancy in line with legal requirements. Contact form enquiries are
              retained for up to two years. We will securely delete or anonymise your data
              when it is no longer required.
            </p>

            <h2 className="font-heading text-2xl font-semibold text-dark mt-10 mb-4">
              6. Your Rights Under GDPR
            </h2>
            <p className="text-text-muted leading-relaxed mb-4">
              You have the following rights in relation to your personal data:
            </p>
            <ul className="list-disc pl-6 text-text-muted space-y-2 mb-6">
              <li><strong className="text-dark">Right of access</strong> &mdash; request a copy of the data we hold about you</li>
              <li><strong className="text-dark">Right to rectification</strong> &mdash; request correction of inaccurate data</li>
              <li><strong className="text-dark">Right to erasure</strong> &mdash; request deletion of your data where there is no compelling reason for continued processing</li>
              <li><strong className="text-dark">Right to restrict processing</strong> &mdash; request that we limit the use of your data</li>
              <li><strong className="text-dark">Right to data portability</strong> &mdash; request transfer of your data in a structured format</li>
              <li><strong className="text-dark">Right to object</strong> &mdash; object to processing based on legitimate interests or direct marketing</li>
            </ul>
            <p className="text-text-muted leading-relaxed mb-6">
              To exercise any of these rights, please contact us at info@mcgowanlettings.co.uk.
              We will respond within one month.
            </p>

            <h2 className="font-heading text-2xl font-semibold text-dark mt-10 mb-4">
              7. Cookies
            </h2>
            <p className="text-text-muted leading-relaxed mb-6">
              Our website uses essential cookies to ensure it functions correctly. We may also
              use analytics cookies to understand how visitors use our site. You can control
              cookie settings through your browser. Essential cookies cannot be disabled as
              they are necessary for the website to operate.
            </p>

            <h2 className="font-heading text-2xl font-semibold text-dark mt-10 mb-4">
              8. Third Parties
            </h2>
            <p className="text-text-muted leading-relaxed mb-4">
              We may share your personal data with the following third parties where necessary:
            </p>
            <ul className="list-disc pl-6 text-text-muted space-y-2 mb-6">
              <li>Referencing agencies for tenant vetting</li>
              <li>Deposit protection schemes (e.g. TDS)</li>
              <li>Property portals (e.g. Zoopla, PrimeLocation) for advertising rental properties</li>
              <li>Maintenance contractors engaged on behalf of landlords</li>
              <li>Professional advisors and regulatory bodies</li>
              <li>Website hosting and analytics providers</li>
            </ul>
            <p className="text-text-muted leading-relaxed mb-6">
              We do not sell your personal data to any third party.
            </p>

            <h2 className="font-heading text-2xl font-semibold text-dark mt-10 mb-4">
              9. Data Security
            </h2>
            <p className="text-text-muted leading-relaxed mb-6">
              We take appropriate technical and organisational measures to protect your personal
              data against unauthorised access, loss, or destruction. Our website uses SSL
              encryption and our data is stored on secure, access-controlled systems.
            </p>

            <h2 className="font-heading text-2xl font-semibold text-dark mt-10 mb-4">
              10. Contact Us
            </h2>
            <p className="text-text-muted leading-relaxed mb-6">
              If you have any questions about this privacy policy or wish to exercise your
              data protection rights, please contact us:
            </p>
            <p className="text-text-muted leading-relaxed mb-6">
              McGowan Residential Lettings Ltd<br />
              PO Box 546, Bury, BL8 9HB<br />
              Phone: 0161 797 6967<br />
              Email: info@mcgowanlettings.co.uk
            </p>
            <p className="text-text-muted leading-relaxed">
              If you are not satisfied with our response, you have the right to lodge a
              complaint with the Information Commissioner&apos;s Office (ICO) at{" "}
              <a
                href="https://ico.org.uk"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand hover:text-brand-dark underline underline-offset-2 transition-colors"
              >
                ico.org.uk
              </a>.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
