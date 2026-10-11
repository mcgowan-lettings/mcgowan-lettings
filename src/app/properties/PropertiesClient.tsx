"use client";

import { Suspense, useCallback, useLayoutEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { AnimateIn } from "@/components/AnimateIn";
import { thumbUrl } from "@/lib/thumb";
import { StaggerGrid } from "@/components/StaggerGrid";
import PropertyCardBadge from "@/components/PropertyCardBadge";
import CardImage from "@/components/CardImage";
import {
  BedIcon,
  BathIcon,
  MapPinIcon,
  SearchIcon,
  ChevronDownIcon,
} from "@/components/Icons";
import {
  BEDROOM_VALUES,
  MAX_PRICE_VALUES,
  TYPE_FILTER_OPTIONS,
  buildAreaList,
  cardAlt,
  formatPrice,
  locationDiffersFromTitle,
  matchesArea,
  matchesBeds,
  matchesPrice,
  parseTypeFilter,
  propertyTypeCategory,
} from "./filters";

/* ───────────────────────── FILTER OPTIONS ───────────────────────── */

const ALL_AREAS = "All Areas";
const ANY_PRICE = "Any Price";
const ANY_BEDS = "Any Beds";
const ALL_TYPES = "All Types";

type Option = { value: string; label: string };

const PRICE_OPTIONS: Option[] = [
  { value: ANY_PRICE, label: ANY_PRICE },
  ...MAX_PRICE_VALUES.map((v) => ({ value: v, label: v })),
];
const BEDROOM_OPTIONS: Option[] = [
  { value: ANY_BEDS, label: ANY_BEDS },
  ...BEDROOM_VALUES.map((v) => ({ value: v, label: v })),
];
const TYPE_OPTIONS: Option[] = [{ value: ALL_TYPES, label: ALL_TYPES }, ...TYPE_FILTER_OPTIONS];

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
  status: string | null;
  is_new: boolean | null;
};

type Filters = { area: string; maxPrice: string; bedrooms: string; type: string };

const DEFAULT_FILTERS: Filters = {
  area: ALL_AREAS,
  maxPrice: ANY_PRICE,
  bedrooms: ANY_BEDS,
  type: ALL_TYPES,
};

/* ───────────────────────── HELPERS ───────────────────────── */

/** Resolve a URL value against the select's options (case-insensitive,
 *  trimmed). If it isn't one of them, append it so the select shows what is
 *  actually being filtered on instead of silently displaying the default. */
function withCurrent(options: Option[], value: string): { options: Option[]; value: string } {
  const key = value.trim().toLowerCase();
  const hit = options.find((o) => o.value.toLowerCase() === key);
  if (hit) return { options, value: hit.value };
  return { options: [...options, { value, label: value }], value };
}

/* ───────────────────────── SELECT COMPONENT ───────────────────────── */

function FilterSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Option[];
  value: string;
  onChange: (v: string) => void;
}) {
  const resolved = withCurrent(options, value);
  return (
    <div className="relative flex-1 min-w-[160px]">
      <select
        aria-label={label}
        value={resolved.value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-h-11 appearance-none bg-white border border-black/10 rounded-md px-4 py-3 pr-10 text-base sm:text-sm text-dark font-medium cursor-pointer focus:ring-2 focus:ring-brand/40 focus:border-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-deep transition-colors"
      >
        {resolved.options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDownIcon aria-hidden="true" className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
    </div>
  );
}

/* ───────────────────────── URL → FILTERS ───────────────────────── */

function filtersFromParams(sp: URLSearchParams): Filters {
  return {
    area: sp.get("area") ?? ALL_AREAS,
    maxPrice: sp.get("maxPrice") ?? ANY_PRICE,
    bedrooms: sp.get("bedrooms") ?? ANY_BEDS,
    type: sp.get("type") ?? ALL_TYPES,
  };
}

function sameFilters(a: Filters, b: Filters) {
  return a.area === b.area && a.maxPrice === b.maxPrice && a.bedrooms === b.bedrooms && a.type === b.type;
}

/* ───────────────────────── URL SYNC ───────────────────────── */

/**
 * Renders nothing; copies the URL's filters into the page's state.
 *
 * /properties is static ISR, and useSearchParams bails the nearest Suspense
 * boundary out of the prerender. Keeping only this null component inside the
 * boundary means the filter bar and every card stay in the static HTML and
 * hydrate in place — nothing is thrown away and re-rendered on load. On a
 * client navigation (hero search, Back from a listing) the params are known
 * synchronously and the layout effect applies them before first paint, so
 * there's no flash of the full list.
 */
function UrlFilterSync({ onUrlFilters }: { onUrlFilters: (f: Filters) => void }) {
  const searchParams = useSearchParams();
  const key = searchParams.toString();
  useLayoutEffect(() => {
    onUrlFilters(filtersFromParams(new URLSearchParams(key)));
  }, [key, onUrlFilters]);
  return null;
}

function writeUrl(next: Filters) {
  // Keep unrelated params (utm_*, etc.); only rewrite the filter keys.
  const params = new URLSearchParams(window.location.search);
  for (const k of ["area", "maxPrice", "bedrooms", "type"]) params.delete(k);
  if (next.area !== ALL_AREAS) params.set("area", next.area);
  if (next.maxPrice !== ANY_PRICE) params.set("maxPrice", next.maxPrice);
  if (next.bedrooms !== ANY_BEDS) params.set("bedrooms", next.bedrooms);
  if (next.type !== ALL_TYPES) params.set("type", next.type);
  const qs = params.toString();
  // Native replaceState is integrated with the Next router (syncs
  // useSearchParams) and, unlike router.replace, doesn't refetch the page.
  window.history.replaceState(null, "", `${window.location.pathname}${qs ? `?${qs}` : ""}`);
}

/* ───────────────────────── FILTER BAR + RESULTS ───────────────────────── */

function Listings({
  properties,
  filters,
  onFilterChange,
  onReset,
}: {
  properties: Property[];
  filters: Filters;
  onFilterChange: (key: keyof Filters, value: string) => void;
  onReset: () => void;
}) {
  const { area, maxPrice, bedrooms, type: propertyType } = filters;

  // Build the area filter list from actual property data: boroughs that have
  // listings first, then any area that doesn't resolve to one.
  const areaOptions = useMemo<Option[]>(
    () => [
      { value: ALL_AREAS, label: ALL_AREAS },
      ...buildAreaList(properties).map((a) => ({ value: a, label: a })),
    ],
    [properties]
  );

  const setArea = (v: string) => onFilterChange("area", v);
  const setMaxPrice = (v: string) => onFilterChange("maxPrice", v);
  const setBedrooms = (v: string) => onFilterChange("bedrooms", v);
  const setPropertyType = (v: string) => onFilterChange("type", v);
  const resetFilters = onReset;

  const filtersActive =
    area !== ALL_AREAS ||
    maxPrice !== ANY_PRICE ||
    bedrooms !== ANY_BEDS ||
    propertyType !== ALL_TYPES;

  const filteredProperties = useMemo(() => {
    const typeCategory = propertyType === ALL_TYPES ? null : parseTypeFilter(propertyType);
    return properties.filter((p) => {
      if (area !== ALL_AREAS && !matchesArea(p, area)) return false;
      if (!matchesPrice(p.price, maxPrice)) return false;
      if (!matchesBeds(p.beds, bedrooms)) return false;
      if (typeCategory && propertyTypeCategory(p.type) !== typeCategory) return false;
      return true;
    });
  }, [properties, area, maxPrice, bedrooms, propertyType]);

  return (
    <>
      {/* ─── FILTER BAR ─── */}
      <section className="bg-white border-b border-black/5 md:sticky md:top-16 z-30">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex flex-wrap items-end gap-3">
            <FilterSelect label="Area" options={areaOptions} value={area} onChange={setArea} />
            <FilterSelect label="Max Price" options={PRICE_OPTIONS} value={maxPrice} onChange={setMaxPrice} />
            <FilterSelect label="Bedrooms" options={BEDROOM_OPTIONS} value={bedrooms} onChange={setBedrooms} />
            <FilterSelect label="Property Type" options={TYPE_OPTIONS} value={parseTypeFilter(propertyType) ?? propertyType} onChange={setPropertyType} />
          </div>

          {filtersActive && (
            <button
              onClick={resetFilters}
              className="mt-1 min-h-11 inline-flex items-center text-sm text-text-muted hover:text-dark transition-colors underline underline-offset-2"
            >
              Reset filters
            </button>
          )}
        </div>
      </section>

      {/* ─── RESULTS ─── */}
      <section className="bg-cream py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-6">
          {/* Results count */}
          <h2 className="sr-only">Available properties</h2>
          <AnimateIn>
            <p role="status" aria-live="polite" className="text-text-muted text-sm mb-8">
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
                      <CardImage
                        src={property.images?.[0] ? thumbUrl(property.images[0]) : "/hero-banner.jpg"}
                        alt={cardAlt(property.title, property.location)}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="property-image object-cover transition-transform duration-700 ease-out"
                      />
                      <div className="absolute bottom-3 left-3 bg-dark/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-sm">
                        <span className="text-lg font-semibold">
                          £{formatPrice(property.price)}
                        </span>
                        <span className="text-white/50 text-xs ml-1">pcm</span>
                      </div>
                      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-dark text-xs font-medium px-2.5 py-1 rounded-sm">
                        {property.type}
                      </div>
                      <PropertyCardBadge status={property.status} isNew={property.is_new} />
                    </div>
                    <div className="p-5">
                      <h3 className="font-semibold text-dark mb-1 group-hover:text-brand-dark transition-colors">
                        {property.title}
                      </h3>
                      {locationDiffersFromTitle(property.title, property.location) && (
                        <div className="flex items-center gap-1 text-text-muted text-sm">
                          <MapPinIcon className="w-3.5 h-3.5 shrink-0" />
                          {property.location}
                        </div>
                      )}
                      <div className="flex items-center gap-4 pt-4 mt-4 border-t border-black/5">
                        <div className="flex items-center gap-1.5 text-sm text-text-muted">
                          <BedIcon className="w-4 h-4" />
                          <span>
                            {property.beds === 0
                              ? "Studio"
                              : `${property.beds} ${property.beds === 1 ? "Bed" : "Beds"}`}
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
          ) : properties.length === 0 ? (
            /* No listings at all (nothing to filter) */
            <AnimateIn>
              <div className="text-center py-16 md:py-24">
                <div className="w-16 h-16 rounded-full bg-warm-grey flex items-center justify-center mx-auto mb-6">
                  <SearchIcon className="w-7 h-7 text-text-light" />
                </div>
                <h2 className="font-heading text-2xl font-semibold text-dark mb-3">
                  No properties available right now
                </h2>
                <p className="text-text-muted max-w-md mx-auto mb-6">
                  New homes come up regularly — check back soon, or get in touch and
                  we&apos;ll let you know when something suitable is available.
                </p>
                <Link
                  href="/contact"
                  className="inline-flex items-center min-h-11 bg-brand hover:bg-brand-light text-dark font-semibold px-6 py-3 rounded-md text-sm transition-colors"
                >
                  Contact us
                </Link>
              </div>
            </AnimateIn>
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
        </div>
      </section>
    </>
  );
}


/* ───────────────────────── PAGE ───────────────────────── */

export default function PropertiesPage({ initialProperties }: { initialProperties: Property[] }) {
  const properties = initialProperties;
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);

  // Stable identity so UrlFilterSync's effect only re-runs on a URL change.
  const applyUrlFilters = useCallback((f: Filters) => {
    setFilters((prev) => (sameFilters(prev, f) ? prev : f));
  }, []);

  function updateFilter(key: keyof Filters, value: string) {
    const next = { ...filters, [key]: value };
    setFilters(next);
    writeUrl(next);
  }

  function resetFilters() {
    setFilters(DEFAULT_FILTERS);
    writeUrl(DEFAULT_FILTERS);
  }

  return (
    <>
      {/* ─── HERO BANNER ─── */}
      <section className="relative min-h-[max(40vh,320px)] flex items-center justify-center overflow-hidden noise-overlay bg-dark focus-on-dark pt-[4.5rem] pb-4">
        <div className="absolute inset-0">
          <Image
            src="/hero-banner.jpg"
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

      <Listings
        properties={properties}
        filters={filters}
        onFilterChange={updateFilter}
        onReset={resetFilters}
      />
      <Suspense fallback={null}>
        <UrlFilterSync onUrlFilters={applyUrlFilters} />
      </Suspense>
    </>
  );
}
