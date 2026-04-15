"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { AnimateIn } from "@/components/AnimateIn";
import {
  StarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowRightIcon,
} from "@/components/Icons";

const TESTIMONIALS = [
  {
    name: "Kesh Athukorala",
    text: "We recently moved into a property through McGowan Residential Lettings Ltd, and the process was very smooth from start to finish. David was professional, friendly, and helpful throughout, he made sure everything was ready for us.",
    rating: 5,
    date: "5 months ago",
  },
  {
    name: "Gavin Foley",
    text: "Dave at McGowan Lettings has been superb throughout our stay in one of his managed properties. He gets back to you immediately with whatever questions you have and anything that needs attention he\u2019s on it straight away.",
    rating: 5,
    date: "5 months ago",
  },
  {
    name: "Tracey Mahony",
    text: "I\u2019m a new tenant of one of David McGowan\u2019s lettings. The house is lovely, well cared for and the whole process of letting the house was managed well and explained fully. David ensured everything ran smoothly and any issues were quickly and efficiently resolved.",
    rating: 5,
    date: "5 months ago",
  },
  {
    name: "Vicky Entwistle",
    text: "Wow! Where do I begin! I can confidently say the experience was exceptional from start to finish. I was worried as a single person I wouldn\u2019t find a private landlord to accept me, David made me feel I had a chance from our first conversation.",
    rating: 5,
    date: "7 months ago",
  },
  {
    name: "Barbara Wainwright",
    text: "Recently I had to leave my own property due to a severe water leak that made it uninhabitable so I needed to rent a property very quickly. I saw a property listed on McGowan Residential Lettings and the whole process was handled quickly and professionally.",
    rating: 5,
    date: "7 months ago",
  },
  {
    name: "Rebecca Barron",
    text: "I reached out to McGowan Residential Lettings and spoke with David who assisted me with finding a new home. David was excellent and managed to help me secure a property in little time and was professional and thorough during the whole process.",
    rating: 5,
    date: "7 months ago",
  },
  {
    name: "Shaun Giblin",
    text: "David made the process of renting and moving in unbelievably easy and stress-free. Communication is fantastic, with any issues getting resolved quickly and with no fuss. I would highly recommend renting with McGowan if you can \u2014 other estate agencies could learn a thing or two!",
    rating: 5,
    date: "8 months ago",
  },
  {
    name: "Nick Jefferson",
    text: "David has made the process of moving incredibly straightforward and stress free! He is diligent in communication and utterly professional in arranging all the details of what can be a difficult journey. I was able to sort out a move in just days.",
    rating: 5,
    date: "9 months ago",
  },
];

const GOOGLE_ICON = (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export default function TestimonialsCarousel() {
  const [current, setCurrent] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [reviewCount, setReviewCount] = useState(366);
  const trackRef = useRef<HTMLDivElement>(null);

  // Fetch live review count from Supabase (falls back to 366)
  useEffect(() => {
    supabase
      .from("site_config")
      .select("value")
      .eq("key", "google_review_count")
      .single()
      .then(({ data }) => {
        if (data?.value) setReviewCount(parseInt(data.value, 10));
      });
  }, []);

  // Show 1 on mobile, 2 on md, 3 on lg
  const [visibleCount, setVisibleCount] = useState(3);

  useEffect(() => {
    const update = () => {
      if (window.innerWidth >= 1024) setVisibleCount(3);
      else if (window.innerWidth >= 768) setVisibleCount(2);
      else setVisibleCount(1);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const maxIndex = TESTIMONIALS.length - visibleCount;

  const next = useCallback(() => {
    setCurrent((c) => (c >= maxIndex ? 0 : c + 1));
  }, [maxIndex]);

  const prev = useCallback(() => {
    setCurrent((c) => (c <= 0 ? maxIndex : c - 1));
  }, [maxIndex]);

  // Auto-advance
  useEffect(() => {
    if (!isAutoPlaying) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [isAutoPlaying, next]);

  // Pause auto-play briefly after interaction, then resume
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleInteraction = () => {
    setIsAutoPlaying(false);
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => setIsAutoPlaying(true), 8000);
  };
  useEffect(() => () => {
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
  }, []);

  // Swipe support for mobile (arrows are hidden on small screens)
  const touchStartX = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(deltaX) > 50) {
      handleInteraction();
      if (deltaX < 0) next();
      else prev();
    }
    touchStartX.current = null;
  };

  return (
    <section className="bg-cream py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-6">
        <AnimateIn className="text-center max-w-2xl mx-auto mb-16">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-px bg-brand" />
            <span className="text-brand text-sm font-semibold tracking-[0.15em] uppercase">Testimonials</span>
            <div className="w-8 h-px bg-brand" />
          </div>
          <h2 className="font-heading text-3xl md:text-4xl font-semibold text-dark leading-tight mb-4">
            What Our Clients Say
          </h2>
          <div className="flex items-center justify-center gap-1 mb-2">
            {[...Array(5)].map((_, i) => (
              <StarIcon key={i} className="w-5 h-5 text-amber-400" />
            ))}
          </div>
          <p className="text-text-muted text-sm mb-3">Rated 5 stars across {reviewCount} Google Reviews</p>
          <a
            href="https://search.google.com/local/writereview?placeid=ChIJ7-uGq-eke0gRBKbenjpoV4E"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand-dark border border-brand/30 px-5 py-2 rounded-sm hover:bg-brand/10 transition-all duration-200"
          >
            Leave Us a Review
            <ArrowRightIcon className="w-3.5 h-3.5" />
          </a>
        </AnimateIn>

        {/* Carousel */}
        <div className="relative px-2 md:px-14">
          {/* Desktop-only side arrows */}
          <button
            onClick={() => { handleInteraction(); prev(); }}
            className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white border border-black/10 shadow-sm items-center justify-center hover:bg-brand hover:text-white hover:border-brand transition-all duration-200"
            aria-label="Previous review"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => { handleInteraction(); next(); }}
            className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white border border-black/10 shadow-sm items-center justify-center hover:bg-brand hover:text-white hover:border-brand transition-all duration-200"
            aria-label="Next review"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>

          {/* Track */}
          <div className="overflow-hidden" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
            <div
              ref={trackRef}
              className="flex transition-transform duration-500 ease-in-out"
              style={{
                transform: `translateX(-${current * (100 / visibleCount)}%)`,
              }}
            >
              {TESTIMONIALS.map((testimonial, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 px-3"
                  style={{ width: `${100 / visibleCount}%` }}
                >
                  <div className="bg-white rounded-lg p-6 md:p-8 border border-black/5 relative h-full min-h-[320px] md:min-h-0 flex flex-col">
                    <div className="text-brand/20 text-6xl font-heading leading-none absolute top-4 right-6">&ldquo;</div>
                    <div className="relative flex flex-col flex-1">
                      <div className="flex items-center gap-0.5 mb-4">
                        {[...Array(testimonial.rating)].map((_, j) => (
                          <StarIcon key={j} className="w-4 h-4 text-amber-400" />
                        ))}
                      </div>
                      <p className="text-dark/80 text-sm leading-relaxed mb-6 flex-1">{testimonial.text}</p>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-dark text-sm">{testimonial.name}</div>
                          <div className="text-text-light text-xs">{testimonial.date}</div>
                        </div>
                        <div className="text-xs text-text-light flex items-center gap-1">
                          {GOOGLE_ICON}
                          Google
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile: arrows flanking dots */}
          <div className="md:hidden flex items-center justify-center gap-4 mt-8">
            <button
              onClick={() => { handleInteraction(); prev(); }}
              className="w-10 h-10 rounded-full bg-white border border-black/10 shadow-sm flex items-center justify-center hover:bg-brand hover:text-white hover:border-brand transition-all duration-200 flex-shrink-0"
              aria-label="Previous review"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            <div className="flex items-center justify-center gap-1 w-[180px]">
              {Array.from({ length: maxIndex + 1 }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => { handleInteraction(); setCurrent(i); }}
                  className="group p-2 -m-1 cursor-pointer flex-1 flex justify-center"
                  aria-label={`Go to slide ${i + 1}`}
                >
                  <span
                    className={`block h-2 rounded-full transition-all duration-200 ${
                      i === current ? "bg-brand w-6" : "bg-dark/20 group-hover:bg-dark/40 w-2"
                    }`}
                  />
                </button>
              ))}
            </div>
            <button
              onClick={() => { handleInteraction(); next(); }}
              className="w-10 h-10 rounded-full bg-white border border-black/10 shadow-sm flex items-center justify-center hover:bg-brand hover:text-white hover:border-brand transition-all duration-200 flex-shrink-0"
              aria-label="Next review"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Desktop: dots only (side arrows handle nav) */}
          <div className="hidden md:flex items-center justify-center gap-1 mt-8">
            {Array.from({ length: maxIndex + 1 }).map((_, i) => (
              <button
                key={i}
                onClick={() => { handleInteraction(); setCurrent(i); }}
                className="group p-3 -m-1 cursor-pointer"
                aria-label={`Go to slide ${i + 1}`}
              >
                <span
                  className={`block h-2 rounded-full transition-all duration-200 ${
                    i === current ? "bg-brand w-6" : "bg-dark/20 group-hover:bg-dark/40 w-2"
                  }`}
                />
              </button>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
