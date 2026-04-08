import Image from "next/image";

export default function ComplaintsPage() {
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
            Complaints Procedure
          </h1>
          <p className="text-white/70 text-lg md:text-xl max-w-xl mx-auto">
            How to raise a complaint and what to expect.
          </p>
        </div>
      </section>

      {/* ── Content ── */}
      <section className="bg-cream py-16 md:py-24">
        <div className="max-w-3xl mx-auto px-6">
          <div className="max-w-none">
            <p className="text-text-muted leading-relaxed mb-8">
              McGowan Residential Lettings Ltd is committed to providing a high-quality service
              to all our landlords, tenants, and applicants. We take complaints seriously and
              aim to resolve any issues quickly, fairly, and transparently. If you are unhappy
              with any aspect of our service, please follow the procedure below.
            </p>

            {/* Step 1 */}
            <div className="bg-white rounded-lg border border-black/5 p-6 md:p-8 mb-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center">
                  <span className="font-heading text-lg font-semibold text-brand">1</span>
                </div>
                <div>
                  <h2 className="font-heading text-xl font-semibold text-dark mb-3">
                    Contact Us Directly
                  </h2>
                  <p className="text-text-muted leading-relaxed mb-4">
                    In the first instance, we encourage you to contact us directly to discuss
                    your concern. Many issues can be resolved informally and promptly through
                    a conversation.
                  </p>
                  <p className="text-text-muted leading-relaxed">
                    <strong className="text-dark">Phone:</strong> 0161 797 6967<br />
                    <strong className="text-dark">Email:</strong> info@mcgowanlettings.co.uk<br />
                    <strong className="text-dark">WhatsApp:</strong> +44 7457 428720
                  </p>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-lg border border-black/5 p-6 md:p-8 mb-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center">
                  <span className="font-heading text-lg font-semibold text-brand">2</span>
                </div>
                <div>
                  <h2 className="font-heading text-xl font-semibold text-dark mb-3">
                    Submit a Written Complaint
                  </h2>
                  <p className="text-text-muted leading-relaxed mb-4">
                    If you are unable to resolve the issue informally, or if you would prefer
                    to make a formal complaint, please put your complaint in writing. Include
                    as much detail as possible, including:
                  </p>
                  <ul className="list-disc pl-6 text-text-muted space-y-2 mb-4">
                    <li>Your name and contact details</li>
                    <li>The property address (if applicable)</li>
                    <li>A clear description of your complaint</li>
                    <li>Any relevant dates, correspondence, or supporting documents</li>
                    <li>The outcome you are seeking</li>
                  </ul>
                  <p className="text-text-muted leading-relaxed">
                    Please send your written complaint to:<br /><br />
                    <strong className="text-dark">McGowan Residential Lettings Ltd</strong><br />
                    PO Box 546<br />
                    Bury, BL8 9HB<br /><br />
                    Or by email to: <strong className="text-dark">info@mcgowanlettings.co.uk</strong>
                  </p>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-lg border border-black/5 p-6 md:p-8 mb-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center">
                  <span className="font-heading text-lg font-semibold text-brand">3</span>
                </div>
                <div>
                  <h2 className="font-heading text-xl font-semibold text-dark mb-3">
                    Internal Review
                  </h2>
                  <p className="text-text-muted leading-relaxed mb-4">
                    Upon receiving your written complaint, we will:
                  </p>
                  <ul className="list-disc pl-6 text-text-muted space-y-2 mb-4">
                    <li>Acknowledge receipt of your complaint within 3 working days</li>
                    <li>Investigate the matter thoroughly and impartially</li>
                    <li>Provide you with a full written response within 15 working days of acknowledgement</li>
                  </ul>
                  <p className="text-text-muted leading-relaxed">
                    If we require additional time to investigate, we will notify you of the
                    delay and provide an estimated response date. Our response will include
                    a summary of our findings and any proposed resolution.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-white rounded-lg border border-black/5 p-6 md:p-8 mb-10">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center">
                  <span className="font-heading text-lg font-semibold text-brand">4</span>
                </div>
                <div>
                  <h2 className="font-heading text-xl font-semibold text-dark mb-3">
                    Escalation to The Property Ombudsman
                  </h2>
                  <p className="text-text-muted leading-relaxed mb-4">
                    If you remain dissatisfied after our internal review, or if we have not
                    resolved your complaint within 8 weeks, you have the right to escalate
                    your complaint to The Property Ombudsman (TPO). TPO provides a free,
                    independent, and impartial dispute resolution service.
                  </p>
                  <p className="text-text-muted leading-relaxed mb-4">
                    You must refer your complaint to TPO within 12 months of receiving our
                    final response.
                  </p>
                  <div className="bg-cream rounded-md p-4">
                    <p className="text-dark font-semibold mb-2">
                      The Property Ombudsman
                    </p>
                    <p className="text-text-muted text-sm leading-relaxed">
                      Milford House, 43&ndash;55 Milford Street<br />
                      Salisbury, Wiltshire, SP1 2BP<br /><br />
                      <strong className="text-dark">Phone:</strong> 01722 333 306<br />
                      <strong className="text-dark">Email:</strong> admin@tpos.co.uk<br />
                      <strong className="text-dark">Website:</strong>{" "}
                      <a
                        href="https://www.tpos.co.uk"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand hover:text-brand-dark underline underline-offset-2 transition-colors"
                      >
                        www.tpos.co.uk
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <h2 className="font-heading text-2xl font-semibold text-dark mt-10 mb-4">
              Our Commitment
            </h2>
            <p className="text-text-muted leading-relaxed mb-6">
              We value all feedback and use complaints as an opportunity to improve our
              services. Every complaint is reviewed at a senior level and, where appropriate,
              changes are made to our processes to prevent similar issues from arising in the
              future.
            </p>
            <p className="text-text-muted leading-relaxed">
              McGowan Residential Lettings Ltd is a member of The Property Ombudsman scheme
              and is committed to following the TPO Code of Practice for Residential Letting
              Agents.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
