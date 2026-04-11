"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { AnimateIn } from "@/components/AnimateIn";
import { StaggerGrid } from "@/components/StaggerGrid";
import { supabase } from "@/lib/supabase";
import {
  BedIcon,
  BathIcon,
  MapPinIcon,
  SearchIcon,
  ChevronDownIcon,
} from "@/components/Icons";

/* ───────────────────────── FILTER OPTIONS ───────────────────────── */

const AREAS = ["All Areas", "Bury", "Bolton", "Manchester", "Rossendale", "Accrington", "Burnley"] as const;
const MAX_PRICES = ["Any Price", "£500", "£750", "£1,000", "£1,250", "£1,500", "£2,000+"] as const;
const BEDROOMS = ["Any Beds", "1", "2", "3", "4+"] as const;
const PROPERTY_TYPES = ["All Types", "House", "Apartment", "Flat", "Bungalow"] as const;

type Property = {
  id: string;
  images: string[];
  price: number;
  title: string;
  location: string;
  area: string;
  beds: number;
  baths: number;
  type: string;
};

/* ───────────────────────── HELPERS ───────────────────────── */

function parsePriceFilter(value: string): number | null {
  if (value === "Any Price") return null;
  if (value === "£2,000+") return 99999;
  return parseInt(value.replace(/[£,]/g, ""), 10);
}

function parseBedsFilter(value: string): number | null {
  if (value === "Any Beds") return null;
  if (value === "4+") return 4;
  return parseInt(value, 10);
}

/* ───────────────────────── SELECT COMPONENT ───────────────────────── */

function FilterSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative flex-1 min-w-[160px]">
      <label className="sr-only">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none bg-white border border-black/10 rounded-md px-4 py-3 pr-10 text-sm text-dark font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition-colors"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
    </div>
  );
}

/* ───────────────────────── PAGE ───────────────────────── */

export default function PropertiesPage() {
  const searchParams = useSearchParams();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [area, setArea] = useState<string>("All Areas");
  const [maxPrice, setMaxPrice] = useState<string>("Any Price");
  const [bedrooms, setBedrooms] = useState<string>("Any Beds");
  const [propertyType, setPropertyType] = useState<string>("All Types");

  // Fetch properties from Supabase
  const fetchProperties = async () => {
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from("properties")
      .select("id, title, price, location, area, beds, baths, type, images")
      .eq("active", true)
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError("Unable to load properties. Please try again.");
    } else if (data) {
      setProperties(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  // Read URL params
  useEffect(() => {
    const a = searchParams.get("area");
    const p = searchParams.get("maxPrice");
    const b = searchParams.get("bedrooms");
    const t = searchParams.get("type");
    if (a) setArea(a);
    if (p) setMaxPrice(p);
    if (b) setBedrooms(b);
    if (t) setPropertyType(t);
  }, [searchParams]);

  const filtersActive =
    area !== "All Areas" ||
    maxPrice !== "Any Price" ||
    bedrooms !== "Any Beds" ||
    propertyType !== "All Types";

  const filteredProperties = useMemo(() => {
    return properties.filter((p) => {
      if (area !== "All Areas" && p.area !== area) return false;

      const priceLimit = parsePriceFilter(maxPrice);
      if (priceLimit !== null && priceLimit !== 99999 && p.price > priceLimit) return false;

      const bedsMin = parseBedsFilter(bedrooms);
      if (bedsMin !== null) {
        if (bedrooms === "4+" && p.beds < 4) return false;
        if (bedrooms !== "4+" && p.beds !== bedsMin) return false;
      }

      if (propertyType !== "All Types" && p.type !== propertyType) return false;

      return true;
    });
  }, [properties, area, maxPrice, bedrooms, propertyType]);

  function resetFilters() {
    setArea("All Areas");
    setMaxPrice("Any Price");
    setBedrooms("Any Beds");
    setPropertyType("All Types");
  }

  return (
    <>
      {/* ─── HERO BANNER ─── */}
      <section className="relative h-[40vh] min-h-[320px] flex items-center justify-center overflow-hidden noise-overlay bg-dark pt-16">
        <div className="absolute inset-0">
          <Image
            src="/hero.jpg"
            alt="Greater Manchester properties"
            fill
            sizes="100vw"
            quality={85}
            className="object-cover object-center opacity-40"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dark/80 via-dark/40 to-dark/60" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-px bg-brand" />
            <span className="text-brand text-sm font-semibold tracking-[0.15em] uppercase">
              Residential Lettings
            </span>
            <div className="w-8 h-px bg-brand" />
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold text-white leading-[1.1] mb-4">
            Our Properties
          </h1>
          <p className="text-white/70 text-lg md:text-xl max-w-xl mx-auto">
            Browse quality rental homes across Bury, Bolton, Manchester, Rossendale and beyond.
          </p>
        </div>
      </section>

      {/* ─── FILTER BAR ─── */}
      <section className="bg-white border-b border-black/5 md:sticky md:top-16 z-30">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex flex-wrap items-end gap-3">
            <FilterSelect label="Area" options={AREAS} value={area} onChange={setArea} />
            <FilterSelect label="Max Price" options={MAX_PRICES} value={maxPrice} onChange={setMaxPrice} />
            <FilterSelect label="Bedrooms" options={BEDROOMS} value={bedrooms} onChange={setBedrooms} />
            <FilterSelect label="Property Type" options={PROPERTY_TYPES} value={propertyType} onChange={setPropertyType} />
          </div>

          {filtersActive && (
            <button
              onClick={resetFilters}
              className="mt-3 text-sm text-text-muted hover:text-dark transition-colors underline underline-offset-2"
            >
              Reset filters
            </button>
          )}
        </div>
      </section>

      {/* ─── RESULTS ─── */}
      <section className="bg-cream py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-6">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
            </div>
          ) : error ? (
            <AnimateIn>
              <div className="text-center py-16 md:py-24">
                <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
                  <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                </div>
                <h2 className="font-heading text-2xl font-semibold text-dark mb-3">
                  Something went wrong
                </h2>
                <p className="text-text-muted max-w-md mx-auto mb-6">
                  {error}
                </p>
                <button
                  onClick={fetchProperties}
                  className="bg-brand hover:bg-brand-light text-dark font-semibold px-6 py-3 rounded-md text-sm transition-colors"
                >
                  Try again
                </button>
              </div>
            </AnimateIn>
          ) : (
            <>
              {/* Results count */}
              <AnimateIn>
                <p className="text-text-muted text-sm mb-8">
                  Showing{" "}
                  <span className="font-semibold text-dark">{filteredProperties.length}</span>{" "}
                  {filteredProperties.length === 1 ? "property" : "properties"}
                </p>
              </AnimateIn>

              {/* Property grid */}
              {filteredProperties.length > 0 ? (
                <StaggerGrid key={`${area}-${maxPrice}-${bedrooms}-${propertyType}`} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6" staggerMs={80}>
                  {filteredProperties.map((property) => (
                    <Link href={`/properties/${property.id}`} key={property.id}>
                      <article className="property-card group bg-white rounded-lg border border-black/5 shadow-sm overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-lg">
                        <div className="relative aspect-[4/3] overflow-hidden bg-warm-grey">
                          <Image
                            src={property.images?.[0] || "/hero.jpg"}
                            alt={property.title}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="property-image object-cover transition-transform duration-700 ease-out"
                          />
                          <div className="absolute bottom-3 left-3 bg-dark/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-sm">
                            <span className="text-lg font-semibold">
                              £{property.price.toLocaleString()}
                            </span>
                            <span className="text-white/50 text-xs ml-1">pcm</span>
                          </div>
                          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-dark text-xs font-medium px-2.5 py-1 rounded-sm">
                            {property.type}
                          </div>
                        </div>
                        <div className="p-5">
                          <h3 className="font-semibold text-dark mb-1 group-hover:text-brand-dark transition-colors">
                            {property.title}
                          </h3>
                          <div className="flex items-center gap-1 text-text-muted text-sm mb-4">
                            <MapPinIcon className="w-3.5 h-3.5" />
                            {property.location}
                          </div>
                          <div className="flex items-center gap-4 pt-4 border-t border-black/5">
                            <div className="flex items-center gap-1.5 text-sm text-text-muted">
                              <BedIcon className="w-4 h-4" />
                              <span>
                                {property.beds} {property.beds === 1 ? "Bed" : "Beds"}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-sm text-text-muted">
                              <BathIcon className="w-4 h-4" />
                              <span>
                                {property.baths} {property.baths === 1 ? "Bath" : "Baths"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </article>
                    </Link>
                  ))}
                </StaggerGrid>
              ) : (
                /* No results */
                <AnimateIn>
                  <div className="text-center py-16 md:py-24">
                    <div className="w-16 h-16 rounded-full bg-warm-grey flex items-center justify-center mx-auto mb-6">
                      <SearchIcon className="w-7 h-7 text-text-light" />
                    </div>
                    <h2 className="font-heading text-2xl font-semibold text-dark mb-3">
                      No properties match your search
                    </h2>
                    <p className="text-text-muted max-w-md mx-auto mb-6">
                      Try adjusting your filters or broadening your search to see more available
                      properties across Greater Manchester.
                    </p>
                    <button
                      onClick={resetFilters}
                      className="bg-brand hover:bg-brand-light text-dark font-semibold px-6 py-3 rounded-md text-sm transition-colors"
                    >
                      Reset all filters
                    </button>
                  </div>
                </AnimateIn>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}
