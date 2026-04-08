import Image from "next/image";

export default function TermsPage() {
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
            Terms of Service
          </h1>
          <p className="text-white/70 text-lg md:text-xl max-w-xl mx-auto">
            Terms governing the use of this website.
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
              1. Introduction
            </h2>
            <p className="text-text-muted leading-relaxed mb-6">
              These terms of service (&ldquo;Terms&rdquo;) govern your use of the McGowan Residential
              Lettings Ltd website at mcgowanlettings.co.uk (&ldquo;the Website&rdquo;). By accessing
              or using this Website, you agree to be bound by these Terms. If you do not agree
              with any part of these Terms, you should not use this Website.
            </p>

            <h2 className="font-heading text-2xl font-semibold text-dark mt-10 mb-4">
              2. Use of This Website
            </h2>
            <p className="text-text-muted leading-relaxed mb-4">
              You may use this Website for lawful purposes only. You must not:
            </p>
            <ul className="list-disc pl-6 text-text-muted space-y-2 mb-6">
              <li>Use the Website in any way that breaches any applicable local, national, or international law or regulation</li>
              <li>Use the Website to transmit any unsolicited or unauthorised advertising or promotional material</li>
              <li>Attempt to gain unauthorised access to any part of the Website or any server, computer, or database connected to the Website</li>
              <li>Use any automated system or software to extract data from the Website for commercial purposes</li>
            </ul>

            <h2 className="font-heading text-2xl font-semibold text-dark mt-10 mb-4">
              3. Property Listings
            </h2>
            <p className="text-text-muted leading-relaxed mb-6">
              Property listings displayed on this Website are provided for general information
              purposes only. While we make every effort to ensure that the details of properties
              (including descriptions, images, prices, and availability) are accurate and
              up-to-date, we do not guarantee or warrant the accuracy, completeness, or
              reliability of any listing information.
            </p>
            <p className="text-text-muted leading-relaxed mb-6">
              Property details, including rental prices, may be subject to change without
              notice. Images may be representative and may not reflect the current condition
              of the property. Floor plans and measurements, where provided, are approximate
              and should not be relied upon for any purpose.
            </p>

            <h2 className="font-heading text-2xl font-semibold text-dark mt-10 mb-4">
              4. No Guarantee of Availability
            </h2>
            <p className="text-text-muted leading-relaxed mb-6">
              The display of a property on this Website does not constitute an offer or
              guarantee that the property is available for rental. Properties may be let,
              withdrawn, or have their terms changed at any time. We recommend contacting us
              directly to confirm the current availability and terms of any property you are
              interested in.
            </p>

            <h2 className="font-heading text-2xl font-semibold text-dark mt-10 mb-4">
              5. Intellectual Property
            </h2>
            <p className="text-text-muted leading-relaxed mb-6">
              All content on this Website, including but not limited to text, graphics, logos,
              images, photographs, and software, is the property of McGowan Residential Lettings
              Ltd or its content suppliers and is protected by copyright and other intellectual
              property laws. You may not reproduce, distribute, modify, or create derivative
              works from any content on this Website without our prior written consent.
            </p>

            <h2 className="font-heading text-2xl font-semibold text-dark mt-10 mb-4">
              6. Limitation of Liability
            </h2>
            <p className="text-text-muted leading-relaxed mb-6">
              To the fullest extent permitted by law, McGowan Residential Lettings Ltd shall
              not be liable for any direct, indirect, incidental, special, consequential, or
              punitive damages arising out of or in connection with your use of this Website,
              including but not limited to:
            </p>
            <ul className="list-disc pl-6 text-text-muted space-y-2 mb-6">
              <li>Any errors or inaccuracies in property listings or other content</li>
              <li>Any loss or damage caused by reliance on information provided on this Website</li>
              <li>Any interruption or cessation of the Website&apos;s availability</li>
              <li>Any viruses or other harmful components transmitted through the Website</li>
            </ul>
            <p className="text-text-muted leading-relaxed mb-6">
              Nothing in these Terms excludes or limits our liability for death or personal
              injury caused by our negligence, fraud or fraudulent misrepresentation, or any
              other liability that cannot be excluded or limited by law.
            </p>

            <h2 className="font-heading text-2xl font-semibold text-dark mt-10 mb-4">
              7. Third-Party Links
            </h2>
            <p className="text-text-muted leading-relaxed mb-6">
              This Website may contain links to third-party websites. These links are provided
              for your convenience only and do not imply endorsement or responsibility for the
              content of those websites. We have no control over the content or availability
              of linked sites and accept no liability for any loss or damage that may arise
              from your use of them.
            </p>

            <h2 className="font-heading text-2xl font-semibold text-dark mt-10 mb-4">
              8. Changes to These Terms
            </h2>
            <p className="text-text-muted leading-relaxed mb-6">
              We reserve the right to update or amend these Terms at any time. Any changes
              will be posted on this page with an updated revision date. Your continued use
              of the Website following any changes constitutes acceptance of the revised Terms.
            </p>

            <h2 className="font-heading text-2xl font-semibold text-dark mt-10 mb-4">
              9. Governing Law
            </h2>
            <p className="text-text-muted leading-relaxed mb-6">
              These Terms are governed by and construed in accordance with the laws of England
              and Wales. Any disputes arising out of or in connection with these Terms shall be
              subject to the exclusive jurisdiction of the courts of England and Wales.
            </p>

            <h2 className="font-heading text-2xl font-semibold text-dark mt-10 mb-4">
              10. Contact Us
            </h2>
            <p className="text-text-muted leading-relaxed">
              If you have any questions about these Terms, please contact us:<br /><br />
              McGowan Residential Lettings Ltd<br />
              PO Box 546, Bury, BL8 9HB<br />
              Phone: 0161 797 6967<br />
              Email: info@mcgowanlettings.co.uk
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
