import Image from "next/image";
import Link from "next/link";
import { AnimateIn } from "@/components/AnimateIn";
import {
  PhoneIcon,
  MailIcon,
  WhatsAppIcon,
  ArrowRightIcon,
  CheckIcon,
} from "@/components/Icons";

const STEPS = [
  {
    step: "01",
    title: "Contact Us Directly",
    description:
      "In the first instance, we encourage you to contact us directly to discuss your concern. Many issues can be resolved informally and promptly through a conversation.",
    content: (
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
        <div className="flex items-center gap-3 bg-cream rounded-md px-4 py-3">
          <PhoneIcon className="w-4 h-4 text-brand-dark shrink-0" />
          <div>
            <p className="text-[11px] text-text-muted uppercase tracking-wider">Phone</p>
            <p className="text-dark text-sm font-medium">0161 797 6967</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-cream rounded-md px-4 py-3 min-w-0">
          <MailIcon className="w-4 h-4 text-brand-dark shrink-0" />
          <div className="min-w-0">
            <p className="text-[11px] text-text-muted uppercase tracking-wider">Email</p>
            <p className="text-dark text-sm font-medium break-all">info@mcgowanlettings.co.uk</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-cream rounded-md px-4 py-3">
          <WhatsAppIcon className="w-4 h-4 text-brand-dark shrink-0" />
          <div>
            <p className="text-[11px] text-text-muted uppercase tracking-wider">WhatsApp</p>
            <p className="text-dark text-sm font-medium">+44 7457 428720</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    step: "02",
    title: "Submit a Written Complaint",
    description:
      "If you are unable to resolve the issue informally, please put your complaint in writing with as much detail as possible.",
    content: (
      <div className="mt-5 space-y-4">
        <div>
          <p className="text-sm text-text-muted mb-3">Your written complaint should include:</p>
          <ul className="space-y-2">
            {[
              "Your name and contact details",
              "The property address (if applicable)",
              "A clear description of your complaint",
              "Any relevant dates, correspondence, or supporting documents",
              "The outcome you are seeking",
            ].map((item) => (
              <li
                key={item}
                className="flex items-start gap-2.5 text-sm text-text-muted"
              >
                <CheckIcon className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-cream rounded-md p-4">
          <p className="text-sm text-text-muted">
            <strong className="text-dark">Post:</strong> McGowan Residential
            Lettings Ltd, PO Box 546, Bury, BL8 9HB
          </p>
          <p className="text-sm text-text-muted mt-1">
            <strong className="text-dark">Email:</strong>{" "}
            info@mcgowanlettings.co.uk
          </p>
        </div>
      </div>
    ),
  },
  {
    step: "03",
    title: "Acknowledgement & Investigation",
    description:
      "We will send you a letter acknowledging receipt of your complaint within three working days of receiving it, enclosing a copy of this procedure.",
    content: (
      <ul className="space-y-2 mt-5">
        {[
          "Acknowledgement within 3 working days",
          "Complaint investigated by the office manager",
          "Written outcome sent within 15 working days of acknowledgement",
        ].map((item) => (
          <li
            key={item}
            className="flex items-start gap-2.5 text-sm text-text-muted"
          >
            <CheckIcon className="w-4 h-4 text-brand shrink-0 mt-0.5" />
            {item}
          </li>
        ))}
      </ul>
    ),
  },
  {
    step: "04",
    title: "Request a Senior Review",
    description:
      "If you are still not satisfied at this stage, you should contact us again and we will arrange for a separate review to take place by a senior member of staff. We will write to you within 15 working days of receiving your request for a review, confirming our final viewpoint on the matter.",
    content: null,
  },
  {
    step: "05",
    title: "The Property Ombudsman",
    description:
      "If you are still not satisfied after our in-house procedure, or more than 8 weeks has elapsed since the complaint was first made, you can request an independent review from The Property Ombudsman without charge.",
    content: (
      <div className="bg-cream rounded-md p-5 mt-5">
        <p className="text-dark font-semibold text-sm mb-3">
          The Property Ombudsman
        </p>
        <p className="text-text-muted text-sm leading-relaxed mb-1">
          Milford House, 43&ndash;55 Milford Street
        </p>
        <p className="text-text-muted text-sm leading-relaxed mb-3">
          Salisbury, Wiltshire, SP1 2BP
        </p>
        <div className="space-y-1 text-sm text-text-muted">
          <p>
            <strong className="text-dark">Phone:</strong> 01722 333 306
          </p>
          <p>
            <strong className="text-dark">Email:</strong> admin@tpos.co.uk
          </p>
          <p>
            <strong className="text-dark">Website:</strong>{" "}
            <a
              href="https://www.tpos.co.uk"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-dark hover:text-brand underline underline-offset-2 transition-colors"
            >
              www.tpos.co.uk
            </a>
          </p>
        </div>
        <p className="text-text-muted text-xs mt-4 leading-relaxed">
          You must submit your complaint to The Property Ombudsman within 12
          months of receiving our final viewpoint letter, including any evidence
          to support your case.
        </p>
      </div>
    ),
  },
];

export default function ComplaintsPage() {
  return (
    <>
      {/* ── Hero Banner ── */}
      <section className="relative h-[40vh] min-h-[320px] flex items-center overflow-hidden noise-overlay bg-dark pt-16">
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
            We are committed to providing a professional service. If something
            goes wrong, here is how we will put it right.
          </p>
        </div>
      </section>

      {/* ── Intro ── */}
      <section className="bg-cream py-16 md:py-24">
        <div className="max-w-5xl mx-auto px-6">
          <AnimateIn>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <p className="text-text-muted leading-relaxed">
                We are committed to providing a professional service to all our
                clients and customers. When something goes wrong, we need you to
                tell us about it. This will help us to improve our standards. If
                you feel we have not sought to address your complaints within
                eight weeks, you may be able to refer your complaint to the
                Property Ombudsman.
              </p>
            </div>
          </AnimateIn>

          {/* ── Steps ── */}
          <div className="space-y-6">
            {STEPS.map((step, i) => (
              <AnimateIn key={step.step} delay={i * 0.08}>
                <div className="bg-white rounded-lg border border-black/5 p-6 md:p-8 shadow-sm relative overflow-hidden group hover:shadow-lg transition-shadow duration-300">
                  <div className="absolute top-0 left-0 h-full w-[3px] bg-brand" />
                  <div className="flex items-start gap-5">
                    <div className="flex-shrink-0">
                      <span className="text-4xl font-heading font-bold text-brand/30 select-none">
                        {step.step}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h2 className="font-heading text-xl font-semibold text-dark mb-2">
                        {step.title}
                      </h2>
                      <p className="text-text-muted text-sm leading-relaxed">
                        {step.description}
                      </p>
                      {step.content}
                    </div>
                  </div>
                </div>
              </AnimateIn>
            ))}
          </div>

          {/* ── Our Commitment ── */}
          <AnimateIn delay={0.4} className="mt-12">
            <div className="bg-dark rounded-lg p-8 md:p-10 text-center">
              <h2 className="font-heading text-2xl font-semibold text-white mb-4">
                Our Commitment
              </h2>
              <p className="text-white/60 text-sm leading-relaxed max-w-2xl mx-auto mb-2">
                We value all feedback and use complaints as an opportunity to
                improve our services. Every complaint is reviewed at a senior
                level and, where appropriate, changes are made to our processes.
              </p>
              <p className="text-white/60 text-sm leading-relaxed max-w-2xl mx-auto">
                McGowan Residential Lettings Ltd is a member of The Property
                Ombudsman scheme and is committed to following the TPO Code of
                Practice for Residential Letting Agents.
              </p>
            </div>
          </AnimateIn>
        </div>
      </section>
    </>
  );
}
