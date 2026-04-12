"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import { AnimateIn } from "@/components/AnimateIn";
import { submitContactForm } from "@/app/actions/contact";
import {
  PhoneIcon,
  WhatsAppIcon,
  MailIcon,
  MapPinIcon,
  ArrowRightIcon,
  ClockIcon,
  StarIcon,
} from "@/components/Icons";

/* ───────────────────────── CONSTANTS ───────────────────────── */

const GOOGLE_REVIEW_URL =
  "https://search.google.com/local/writereview?placeid=ChIJ7-uGq-eke0gRBKbenjpoV4E";

const ENQUIRY_TYPES = [
  "Tenant looking for a property",
  "Landlord seeking management",
  "Landlord requesting a valuation",
  "Other enquiry",
];

/* ───────────────────────── PAGE ───────────────────────── */

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    enquiryType: "",
    message: "",
    website: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const result = await submitContactForm({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        type: formData.enquiryType,
        message: formData.message,
        website: formData.website,
      });

      if (result.success) {
        setSubmitted(true);
      } else {
        setError(result.error);
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

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
              Contact Us
            </span>
            <div className="w-8 h-px bg-brand" />
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold text-white leading-[1.1] mb-4">
            Get in Touch
          </h1>
          <p className="text-white/70 text-lg md:text-xl max-w-xl mx-auto">
            David personally responds to every enquiry. Whether you&apos;re a
            landlord or a tenant, we&apos;re here to help.
          </p>
        </div>
      </section>

      {/* ── Contact Info + Form ── */}
      <section className="bg-cream py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6">
          {/* Section heading — full width */}
          <AnimateIn>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-px bg-brand" />
              <span className="text-brand text-sm font-semibold tracking-[0.15em] uppercase">
                Reach Us
              </span>
            </div>
            <h2 className="font-heading text-3xl md:text-4xl font-semibold text-dark mb-4">
              Contact Information
            </h2>
            <p className="text-text-muted text-lg max-w-2xl mb-14">
              Get in touch and David will personally respond within a few hours.
              Whether you&apos;re a landlord or a tenant, we&apos;re here to help.
            </p>
          </AnimateIn>

          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
            {/* LEFT — Contact cards */}
            <div className="space-y-4">
              {/* Phone */}
              <AnimateIn delay={0.05}>
                <a
                  href="tel:01617976967"
                  className="group flex items-start gap-4 bg-white rounded-lg border border-black/5 shadow-sm p-5 transition-shadow hover:shadow-md"
                >
                  <span className="flex-shrink-0 w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center text-brand">
                    <PhoneIcon className="w-5 h-5" />
                  </span>
                  <div>
                    <p className="text-xs text-text-muted uppercase tracking-wider mb-1">
                      Phone
                    </p>
                    <p className="text-dark font-medium group-hover:text-brand transition-colors">
                      0161 797 6967
                    </p>
                  </div>
                </a>
              </AnimateIn>

              {/* WhatsApp */}
              <AnimateIn delay={0.1}>
                <a
                  href="https://wa.me/447457428720"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-4 bg-white rounded-lg border border-black/5 shadow-sm p-5 transition-shadow hover:shadow-md"
                >
                  <span className="flex-shrink-0 w-10 h-10 rounded-full bg-[#25D366]/10 flex items-center justify-center text-[#25D366]">
                    <WhatsAppIcon className="w-5 h-5" />
                  </span>
                  <div>
                    <p className="text-xs text-text-muted uppercase tracking-wider mb-1">
                      WhatsApp
                    </p>
                    <p className="text-dark font-medium group-hover:text-[#25D366] transition-colors">
                      +44 7457 428720
                    </p>
                    <p className="text-xs text-text-light mt-0.5">
                      Tap to message us directly
                    </p>
                  </div>
                </a>
              </AnimateIn>

              {/* Email */}
              <AnimateIn delay={0.15}>
                <a
                  href="mailto:info@mcgowanlettings.co.uk"
                  className="group flex items-start gap-4 bg-white rounded-lg border border-black/5 shadow-sm p-5 transition-shadow hover:shadow-md"
                >
                  <span className="flex-shrink-0 w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center text-brand">
                    <MailIcon className="w-5 h-5" />
                  </span>
                  <div>
                    <p className="text-xs text-text-muted uppercase tracking-wider mb-1">
                      Email
                    </p>
                    <p className="text-dark font-medium group-hover:text-brand transition-colors">
                      info@mcgowanlettings.co.uk
                    </p>
                  </div>
                </a>
              </AnimateIn>

              {/* Address */}
              <AnimateIn delay={0.2}>
                <div className="flex items-start gap-4 bg-white rounded-lg border border-black/5 shadow-sm p-5">
                  <span className="flex-shrink-0 w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center text-brand">
                    <MapPinIcon className="w-5 h-5" />
                  </span>
                  <div>
                    <p className="text-xs text-text-muted uppercase tracking-wider mb-1">
                      Office Address
                    </p>
                    <p className="text-dark font-medium leading-relaxed">
                      McGowan Lettings Ltd
                      <br />
                      PO Box 546
                      <br />
                      Bury, BL8 9HB
                    </p>
                  </div>
                </div>
              </AnimateIn>

              {/* Opening Hours */}
              <AnimateIn delay={0.25}>
                <div className="flex items-start gap-4 bg-white rounded-lg border border-black/5 shadow-sm p-5">
                  <span className="flex-shrink-0 w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center text-brand">
                    <ClockIcon className="w-5 h-5" />
                  </span>
                  <div>
                    <p className="text-xs text-text-muted uppercase tracking-wider mb-2">
                      Opening Hours
                    </p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between gap-8">
                        <span className="text-text-muted">Mon &ndash; Fri</span>
                        <span className="text-dark font-medium">9:00am &ndash; 6:00pm</span>
                      </div>
                      <div className="flex justify-between gap-8">
                        <span className="text-text-muted">Saturday</span>
                        <span className="text-dark font-medium">10:00am &ndash; 2:00pm</span>
                      </div>
                      <div className="flex justify-between gap-8">
                        <span className="text-text-muted">Sunday</span>
                        <span className="text-dark font-medium">By appointment</span>
                      </div>
                    </div>
                  </div>
                </div>
              </AnimateIn>
            </div>

            {/* RIGHT — Contact form */}
            <div>
              <AnimateIn delay={0.1}>
                <div className="bg-white rounded-lg border border-black/5 shadow-sm p-8 md:p-10">
                  <h2 className="font-heading text-2xl md:text-3xl font-semibold text-dark mb-2">
                    Send Us a Message
                  </h2>
                  <p className="text-text-muted  text-sm mb-8">
                    Fill in the form below and David will get back to you as
                    soon as possible.
                  </p>

                  {submitted ? (
                    <div className="text-center py-12 flex flex-col items-center justify-center min-h-[300px]">
                      <div className="w-14 h-14 rounded-full bg-brand/10 flex items-center justify-center mx-auto mb-4">
                        <MailIcon className="w-7 h-7 text-brand" />
                      </div>
                      <h3 className="font-heading text-xl text-dark mb-2">
                        Message Sent
                      </h3>
                      <p className="text-text-muted  text-sm max-w-sm mx-auto">
                        Thank you for getting in touch. David will respond to
                        your enquiry shortly.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-5" noValidate={false}>
                      {/* Honeypot — bots auto-fill this; real users won't see it */}
                      <div
                        aria-hidden="true"
                        style={{ position: "absolute", left: "-10000px", width: "1px", height: "1px", overflow: "hidden" }}
                      >
                        <label htmlFor="website">Website</label>
                        <input
                          type="text"
                          id="website"
                          name="website"
                          tabIndex={-1}
                          autoComplete="off"
                          value={formData.website}
                          onChange={(e) =>
                            setFormData({ ...formData, website: e.target.value })
                          }
                        />
                      </div>

                      {/* Name */}
                      <div>
                        <label
                          htmlFor="name"
                          className="block text-xs font-medium text-dark mb-1.5 uppercase tracking-wider"
                        >
                          Name
                        </label>
                        <input
                          type="text"
                          id="name"
                          required
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          className="w-full border border-black/10 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-colors bg-white "
                          placeholder="Your full name"
                        />
                      </div>

                      {/* Phone + Email row */}
                      <div className="grid sm:grid-cols-2 gap-5">
                        <div>
                          <label
                            htmlFor="phone"
                            className="block text-xs font-medium text-dark mb-1.5 uppercase tracking-wider"
                          >
                            Phone
                          </label>
                          <input
                            type="tel"
                            id="phone"
                            required
                            value={formData.phone}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                phone: e.target.value,
                              })
                            }
                            className="w-full border border-black/10 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-colors bg-white "
                            placeholder="07123 456789"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="email"
                            className="block text-xs font-medium text-dark mb-1.5 uppercase tracking-wider"
                          >
                            Email
                          </label>
                          <input
                            type="email"
                            id="email"
                            required
                            value={formData.email}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                email: e.target.value,
                              })
                            }
                            className="w-full border border-black/10 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-colors bg-white "
                            placeholder="you@example.com"
                          />
                        </div>
                      </div>

                      {/* Enquiry type */}
                      <div>
                        <label
                          htmlFor="enquiryType"
                          className="block text-xs font-medium text-dark mb-1.5 uppercase tracking-wider"
                        >
                          I am a&hellip;
                        </label>
                        <div className="relative">
                          <select
                            id="enquiryType"
                            required
                            value={formData.enquiryType}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                enquiryType: e.target.value,
                              })
                            }
                            className="w-full appearance-none border border-black/10 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-colors bg-white  pr-10"
                          >
                            <option value="" disabled>
                              Select an option
                            </option>
                            {ENQUIRY_TYPES.map((type) => (
                              <option key={type} value={type}>
                                {type}
                              </option>
                            ))}
                          </select>
                          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={2}
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                              />
                            </svg>
                          </span>
                        </div>
                      </div>

                      {/* Message */}
                      <div>
                        <label
                          htmlFor="message"
                          className="block text-xs font-medium text-dark mb-1.5 uppercase tracking-wider"
                        >
                          Message
                        </label>
                        <textarea
                          id="message"
                          required
                          rows={5}
                          value={formData.message}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              message: e.target.value,
                            })
                          }
                          className="w-full border border-black/10 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-colors bg-white  resize-none"
                          placeholder="How can we help?"
                        />
                      </div>

                      {/* Error message */}
                      {error && (
                        <p
                          id="contact-form-error"
                          role="alert"
                          aria-live="polite"
                          className="text-red-600 text-sm"
                        >
                          {error}
                        </p>
                      )}

                      {/* Submit */}
                      <button
                        type="submit"
                        disabled={submitting}
                        aria-describedby={error ? "contact-form-error" : undefined}
                        className="inline-flex items-center gap-2 bg-brand text-dark font-semibold px-8 py-3.5 rounded-sm hover:bg-brand-light transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {submitting ? "Sending..." : "Send Message"}
                        {!submitting && <ArrowRightIcon className="w-4 h-4" />}
                      </button>
                    </form>
                  )}
                </div>
              </AnimateIn>
            </div>
          </div>
        </div>
      </section>

      {/* ── Google Maps ── */}
      <section className="bg-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6">
          <AnimateIn>
            <div className="text-center mb-10">
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="w-8 h-px bg-brand" />
                <span className="text-brand text-sm font-semibold tracking-[0.15em] uppercase">
                  Our Location
                </span>
                <div className="w-8 h-px bg-brand" />
              </div>
              <h2 className="font-heading text-3xl md:text-4xl font-semibold text-dark">
                Find Us
              </h2>
            </div>
          </AnimateIn>
          <AnimateIn delay={0.1}>
            <div className="rounded-lg overflow-hidden border border-black/5 shadow-sm">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d9490!2d-2.2975!3d53.5935!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x487bb7e8c9a6f0e1%3A0x1!2sBury+BL8+9HB!5e0!3m2!1sen!2suk!4v1"
                width="100%"
                height="450"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="McGowan Lettings location — Bury, Greater Manchester"
              />
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* ── Google Review CTA ── */}
      <section className="bg-dark">
        <div className="max-w-7xl mx-auto px-6 py-14 md:py-16 flex flex-col md:flex-row items-center justify-between gap-6">
          <AnimateIn fadeOnly>
            <div className="flex items-center gap-3">
              <div className="flex -space-x-0.5 text-brand">
                {[...Array(5)].map((_, i) => (
                  <StarIcon key={i} className="w-5 h-5" />
                ))}
              </div>
              <div>
                <h3 className="font-heading text-xl md:text-2xl text-white">
                  Leave Us a Google Review
                </h3>
                <p className="text-white/50  text-sm mt-1">
                  Your feedback helps other landlords and tenants find us.
                </p>
              </div>
            </div>
          </AnimateIn>
          <AnimateIn fadeOnly delay={0.1}>
            <a
              href={GOOGLE_REVIEW_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-brand text-dark font-semibold px-8 py-3.5 rounded-sm hover:bg-brand-light transition-colors whitespace-nowrap"
            >
              Write a Review
              <ArrowRightIcon className="w-4 h-4" />
            </a>
          </AnimateIn>
        </div>
      </section>
    </>
  );
}
