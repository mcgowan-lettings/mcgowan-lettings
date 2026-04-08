"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import { AnimateIn } from "@/components/AnimateIn";
import { submitValuationForm } from "@/app/actions/valuation";
import {
  ArrowRightIcon,
  CheckIcon,
  ShieldIcon,
  ClockIcon,
} from "@/components/Icons";

/* ───────────────────────── CONSTANTS ───────────────────────── */

const PROPERTY_TYPES = ["House", "Apartment", "Flat", "Bungalow", "Other"];

const BEDROOMS = ["1", "2", "3", "4", "5+"];

const SITUATIONS = [
  "I'm a new landlord",
  "I'm switching agents",
  "I have a vacant property",
  "Just curious about value",
];

const BENEFITS = [
  {
    icon: ShieldIcon,
    title: "No Obligation",
    description:
      "Our valuations are completely free with no strings attached. Get an honest assessment of your property's rental potential.",
  },
  {
    icon: ClockIcon,
    title: "Personal Service",
    description:
      "David personally visits every property and provides a tailored recommendation — no call centres or junior staff.",
  },
  {
    icon: CheckIcon,
    title: "25+ Years Experience",
    description:
      "With over two decades in the Greater Manchester lettings market, we know exactly what tenants are looking for.",
  },
];

/* ───────────────────────── PAGE ───────────────────────── */

export default function ValuationPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    propertyType: "",
    bedrooms: "",
    situation: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const result = await submitValuationForm({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      property_type: formData.propertyType,
      bedrooms: formData.bedrooms,
      situation: formData.situation,
      message: formData.message,
    });

    setSubmitting(false);

    if (result.success) {
      setSubmitted(true);
    } else {
      setError(result.error);
    }
  }

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
              Landlords
            </span>
            <div className="w-8 h-px bg-brand" />
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold text-white leading-[1.1] mb-4">
            Free Property Valuation
          </h1>
          <p className="text-white/70 text-lg md:text-xl max-w-xl mx-auto">
            Find out what your property could earn with a free, no-obligation
            rental valuation from our local experts.
          </p>
        </div>
      </section>

      {/* ── Valuation Form Section ── */}
      <section className="bg-cream py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-5 gap-12">
            {/* Left column — info */}
            <div className="lg:col-span-2">
              <AnimateIn>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-px bg-brand" />
                  <span className="text-brand text-sm font-semibold tracking-[0.15em] uppercase">
                    Get Started
                  </span>
                </div>
                <h2 className="font-heading text-3xl md:text-4xl font-semibold text-dark mb-4">
                  What Could Your Property Earn?
                </h2>
                <p className="text-text-muted leading-relaxed mb-8">
                  Fill in the details and David will personally get back to you
                  within 24 hours with an accurate rental assessment — completely
                  free, no obligation.
                </p>

                <div className="space-y-4">
                  {[
                    "Free, no-obligation valuation",
                    "Personal visit from David",
                    "Honest, accurate rental assessment",
                    "Advice on maximising your income",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-brand/10 flex items-center justify-center shrink-0">
                        <CheckIcon className="w-3 h-3 text-brand" />
                      </div>
                      <span className="text-dark text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </AnimateIn>
            </div>

            {/* Right column — form */}
            <div className="lg:col-span-3">
          <AnimateIn delay={0.1}>
            <div className="bg-white rounded-lg border border-black/5 shadow-sm p-8 md:p-10">

              {submitted ? (
                <div className="text-center py-12 flex flex-col items-center justify-center min-h-[300px]">
                  <div className="w-14 h-14 rounded-full bg-brand/10 flex items-center justify-center mx-auto mb-4">
                    <CheckIcon className="w-7 h-7 text-brand" />
                  </div>
                  <h3 className="font-heading text-xl text-dark mb-2">
                    Valuation Requested
                  </h3>
                  <p className="text-text-muted  text-sm max-w-sm mx-auto">
                    Thank you! David will be in touch within 24 hours.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Name */}
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-xs font-medium text-dark mb-1.5 uppercase tracking-wider"
                    >
                      Name *
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

                  {/* Email + Phone row */}
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-xs font-medium text-dark mb-1.5 uppercase tracking-wider"
                      >
                        Email *
                      </label>
                      <input
                        type="email"
                        id="email"
                        required
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className="w-full border border-black/10 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-colors bg-white "
                        placeholder="you@example.com"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="phone"
                        className="block text-xs font-medium text-dark mb-1.5 uppercase tracking-wider"
                      >
                        Phone *
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        required
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        className="w-full border border-black/10 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-colors bg-white "
                        placeholder="07123 456789"
                      />
                    </div>
                  </div>

                  {/* Property address */}
                  <div>
                    <label
                      htmlFor="address"
                      className="block text-xs font-medium text-dark mb-1.5 uppercase tracking-wider"
                    >
                      Property Address *
                    </label>
                    <input
                      type="text"
                      id="address"
                      required
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                      className="w-full border border-black/10 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-colors bg-white "
                      placeholder="Full address of the property"
                    />
                  </div>

                  {/* Property type + Bedrooms row */}
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label
                        htmlFor="propertyType"
                        className="block text-xs font-medium text-dark mb-1.5 uppercase tracking-wider"
                      >
                        Property Type
                      </label>
                      <div className="relative">
                        <select
                          id="propertyType"
                          value={formData.propertyType}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              propertyType: e.target.value,
                            })
                          }
                          className="w-full appearance-none border border-black/10 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-colors bg-white  pr-10"
                        >
                          <option value="" disabled>
                            Select type
                          </option>
                          {PROPERTY_TYPES.map((type) => (
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
                    <div>
                      <label
                        htmlFor="bedrooms"
                        className="block text-xs font-medium text-dark mb-1.5 uppercase tracking-wider"
                      >
                        Bedrooms
                      </label>
                      <div className="relative">
                        <select
                          id="bedrooms"
                          value={formData.bedrooms}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              bedrooms: e.target.value,
                            })
                          }
                          className="w-full appearance-none border border-black/10 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-colors bg-white  pr-10"
                        >
                          <option value="" disabled>
                            Select bedrooms
                          </option>
                          {BEDROOMS.map((num) => (
                            <option key={num} value={num}>
                              {num}
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
                  </div>

                  {/* Current situation */}
                  <div>
                    <label
                      htmlFor="situation"
                      className="block text-xs font-medium text-dark mb-1.5 uppercase tracking-wider"
                    >
                      Current Situation
                    </label>
                    <div className="relative">
                      <select
                        id="situation"
                        value={formData.situation}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            situation: e.target.value,
                          })
                        }
                        className="w-full appearance-none border border-black/10 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-colors bg-white  pr-10"
                      >
                        <option value="" disabled>
                          Select an option
                        </option>
                        {SITUATIONS.map((situation) => (
                          <option key={situation} value={situation}>
                            {situation}
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
                      Additional Information{" "}
                      <span className="text-text-light font-normal normal-case">
                        (optional)
                      </span>
                    </label>
                    <textarea
                      id="message"
                      rows={4}
                      value={formData.message}
                      onChange={(e) =>
                        setFormData({ ...formData, message: e.target.value })
                      }
                      className="w-full border border-black/10 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-colors bg-white  resize-none"
                      placeholder="Anything else you'd like us to know about the property?"
                    />
                  </div>

                  {/* Error message */}
                  {error && <p className="text-red-600 text-sm">{error}</p>}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 bg-brand text-dark font-semibold px-8 py-3.5 rounded-sm hover:bg-brand-light transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {submitting ? "Submitting..." : "Request Free Valuation"}
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

      {/* ── Why Choose McGowan? ── */}
      <section className="bg-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6">
          <AnimateIn>
            <div className="text-center mb-14">
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="w-8 h-px bg-brand" />
                <span className="text-brand text-sm font-semibold tracking-[0.15em] uppercase">
                  Why Us
                </span>
                <div className="w-8 h-px bg-brand" />
              </div>
              <h2 className="font-heading text-3xl md:text-4xl font-semibold text-dark">
                Why Choose McGowan?
              </h2>
            </div>
          </AnimateIn>

          <div className="grid md:grid-cols-3 gap-8">
            {BENEFITS.map((benefit, index) => (
              <AnimateIn key={benefit.title} delay={index * 0.1}>
                <div className="bg-cream rounded-lg border border-black/5 shadow-sm p-8 text-center h-full">
                  <div className="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center mx-auto mb-5">
                    <benefit.icon className="w-6 h-6 text-brand" />
                  </div>
                  <h3 className="font-heading text-lg font-semibold text-dark mb-3">
                    {benefit.title}
                  </h3>
                  <p className="text-text-muted  text-sm leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
