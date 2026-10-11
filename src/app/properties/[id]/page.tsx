import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Metadata } from "next";
import { supabaseAdmin } from "@/lib/supabase-server";
import { safeJsonLd } from "@/lib/json-ld";
import { getProperty } from "./get-property";
import { SITE_URL } from "@/lib/site";
import {
  cardAlt,
  displayStatus,
  formatPrice,
  isLetAgreed as statusIsLetAgreed,
  locationDiffersFromTitle,
  normaliseArea,
  resolveArea,
  resolveCounty,
  sortByAvailability,
} from "../filters";
import { thumbUrl } from "@/lib/thumb";

// Cached statically; updateProperty / togglePropertyActive / deleteProperty
// all call `revalidatePath(/properties/${id})` so edits, deactivation and
// deletion go live immediately. The 60s ceiling is a safety net.
export const revalidate = 60;

// Without generateStaticParams a dynamic segment is rendered per request
// (ƒ Dynamic, `Cache-Control: private, no-store`) and `revalidate` is
// ignored. An empty list prerenders nothing at build but opts the route into
// ISR: each listing is rendered on first visit, cached, and revalidated.
// dynamicParams stays at its default (true) so new listings still render.
// Nothing in this route may read cookies()/headers() or it falls back to
// dynamic again.
export async function generateStaticParams(): Promise<{ id: string }[]> {
  return [];
}

import PropertyGallery from "./PropertyGallery";
import ExpandableDescription from "./ExpandableDescription";
import PropertyCardBadge from "@/components/PropertyCardBadge";
import CardImage from "@/components/CardImage";
import { isHtml } from "@/lib/rich-text";
import { sanitizeHtml } from "@/lib/sanitize-html";
import {
  BedIcon,
  BathIcon,
  MapPinIcon,
  PhoneIcon,
  WhatsAppIcon,
  MailIcon,
  HomeIcon,
  SofaIcon,
  CheckIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
} from "@/components/Icons";

type Props = {
  params: Promise<{ id: string }>;
};

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  pound: "£",
  ndash: "–",
  mdash: "—",
  hellip: "…",
  rsquo: "’",
  lsquo: "‘",
  rdquo: "”",
  ldquo: "“",
};

function decodeEntities(text: string): string {
  // Loop so double-encoded text ("&amp;amp;") decodes fully.
  let prev: string;
  let out = text;
  let guard = 0;
  do {
    prev = out;
    out = out.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, code: string) => {
      if (code[0] === "#") {
        const n = code[1] === "x" || code[1] === "X" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
        return Number.isFinite(n) && n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : m;
      }
      const named = NAMED_ENTITIES[code.toLowerCase()];
      return named ?? m;
    });
  } while (out !== prev && ++guard < 3);
  return out;
}

// `description` is stored as sanitized HTML; strip tags and decode entities
// so <p>, "&amp;" etc. don't land in meta descriptions or JSON-LD. Tags are
// replaced by spaces (so "</p><p>" doesn't glue words), then the stray
// space that leaves before punctuation ("property , occupying") is removed.
function plainText(html: string | null | undefined): string {
  return decodeEntities((html ?? "").replace(/<[^>]+>/g, " "))
    .replace(/[\s\u00a0]+/g, " ")
    .replace(/ +([,.;:!?])/g, "$1")
    .trim();
}

/** Trim to `max` chars on a word boundary, adding "…" when cut. */
function truncateWords(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  const base = lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut;
  return `${base.replace(/[\s,.;:!?\-–—]+$/, "")}…`;
}

/** Today's date in Europe/London as YYYY-MM-DD. */
function londonToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const property = await getProperty(id);

  // Inactive listings 404 in the page body; don't leak their title/price
  // into <head> either.
  if (!property || !property.active) {
    // Mirrors not-found.tsx: no inherited canonical (/properties) and no
    // robots tag of our own — the not-found boundary emits the only
    // `noindex`, so there aren't conflicting robots metas.
    return {
      title: "Property Not Found | McGowan Residential Lettings",
      description: "This property is no longer available. Browse our current rental listings.",
      robots: null,
      alternates: { canonical: null },
      openGraph: null,
      twitter: null,
    };
  }

  const title = `${property.title} | McGowan Residential Lettings`;
  const plainDescription = truncateWords(plainText(property.description), 160);
  const description =
    plainDescription ||
    `${property.beds === 0 ? "Studio" : `${property.beds} bed`} ${property.type?.toLowerCase() || "property"} to rent in ${property.location} — £${formatPrice(property.price)}/pcm. View details and book a viewing with McGowan Lettings.`;
  const images: string[] = property.images ?? [];
  const ogImage = images[0] || "/hero.jpg";

  return {
    title,
    description,
    alternates: {
      canonical: `/properties/${id}`,
    },
    openGraph: {
      title,
      description,
      images: [
        // Property photo dimensions aren't stored, so don't guess them.
        images[0]
          ? { url: ogImage }
          : { url: ogImage, width: 2880, height: 1920 },
      ],
      siteName: "McGowan Residential Lettings",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function PropertyDetailPage({ params }: Props) {
  const { id } = await params;
  const property = await getProperty(id);

  if (!property || !property.active) {
    notFound();
  }

  // Similar properties: same borough (via resolveArea, so "Ramsbottom" and
  // "Tottington" both count as Bury) and/or same type. Borough resolution
  // happens in JS, so fetch the (small) active set with parameterised
  // filters only — no raw PostgREST `.or()` string built from user-typed
  // values — then rank: available homes first, then rows matching both
  // borough and type, then either; price desc within each tier.
  const { data: similarPool, error: similarError } = await supabaseAdmin
    .from("properties")
    .select("id, title, price, location, area, beds, baths, type, images, status, is_new")
    .eq("active", true)
    .neq("id", id)
    .limit(200);

  // Throw on a failed query: a failed ISR regeneration then keeps serving the
  // last good page instead of caching one with the section silently missing.
  if (similarError) throw new Error(`Failed to load similar properties: ${similarError.message}`);

  const borough = normaliseArea(resolveArea(property));
  const typeKey = normaliseArea(property.type);
  const similarScore = (p: { area?: string | null; location?: string | null; type?: string | null }) =>
    (borough && normaliseArea(resolveArea(p)) === borough ? 2 : 0) +
    (typeKey && normaliseArea(p.type) === typeKey ? 1 : 0);
  // sortByAvailability: available first, then price desc. The second sort is
  // stable, so it only lifts better matches within each availability group.
  const similarProperties = sortByAvailability(similarPool ?? [])
    .map((p) => ({ p, score: similarScore(p) }))
    .filter((x) => x.score > 0)
    .sort(
      (a, b) =>
        Number(statusIsLetAgreed(a.p.status)) - Number(statusIsLetAgreed(b.p.status)) ||
        b.score - a.score
    )
    .slice(0, 3)
    .map((x) => x.p);

  const images: string[] = property.images ?? [];
  const videos: string[] = property.videos ?? [];
  const hasImages = images.length > 0;

  // Only real, David-entered features — never invented defaults (claiming
  // "gas central heating" on a property that doesn't have it is misleading).
  // The block is hidden when there are none. Features are hand-typed (often pasted from old listings), so repeats like
  // "EPC Rating: B" listed twice are dropped — they'd also collide as React keys.
  const seenFeatures = new Set<string>();
  const dbFeatures: string[] = (property.features ?? [])
    .map((f: string) => f.trim())
    .filter((f: string) => {
      const k = f.toLowerCase();
      if (!f || seenFeatures.has(k)) return false;
      seenFeatures.add(k);
      return true;
    });
  const features = dbFeatures;

  const status = displayStatus(property.status);
  const isLetAgreed = statusIsLetAgreed(property.status);
  const showNew = !isLetAgreed && property.is_new === true;

  // Extra details — only fields that aren't already in the price bar
  const extraDetails: { label: string; value: string }[] = [];
  if (isLetAgreed) {
    // A let home isn't "Available now" (or "Available From" a future date).
    extraDetails.push({ label: "Availability", value: "Let Agreed" });
  } else if (property.available_from) {
    // Stored as a date ("YYYY-MM-DD"); a past date reads as stale, so show
    // "Available now" once it's today or earlier (UK time).
    const availableDate = String(property.available_from).slice(0, 10);
    const parsed = new Date(`${availableDate}T00:00:00Z`);
    if (!Number.isNaN(parsed.getTime())) {
      extraDetails.push(
        availableDate <= londonToday()
          ? { label: "Availability", value: "Available now" }
          : {
              label: "Available From",
              value: parsed.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
                timeZone: "UTC",
              }),
            }
      );
    }
  }
  if (property.council_tax_band) {
    extraDetails.push({ label: "Council Tax Band", value: property.council_tax_band });
  }

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: property.title,
    description:
      plainText(property.description) ||
      (locationDiffersFromTitle(property.title, property.location)
        ? `${property.title} in ${property.location}`
        : property.title),
    url: `${SITE_URL}/properties/${id}`,
    image: images[0] || undefined,
    offers: {
      "@type": "Offer",
      price: property.price,
      priceCurrency: "GBP",
      availability: isLetAgreed ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: property.location,
      // Bury/Bolton/Manchester/Rochdale → Greater Manchester; Rossendale,
      // Accrington, Burnley, Blackburn, Chorley → Lancashire; else omitted.
      addressRegion: resolveCounty(property) ?? undefined,
      addressCountry: "GB",
    },
    numberOfRooms: property.beds,
    numberOfBathroomsTotal: property.baths,
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Properties", item: `${SITE_URL}/properties` },
      { "@type": "ListItem", position: 3, name: property.title },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd) }} />

      {/* ── Gallery — full width ── */}
      <section className="bg-dark pt-16">
        {hasImages || videos.length > 0 ? (
          <PropertyGallery propertyId={id} images={images} videos={videos} title={property.title} />
        ) : (
          <div className="w-full h-[45vh] md:h-[55vh] max-h-[550px] bg-warm-grey flex items-center justify-center">
            <HomeIcon className="w-16 h-16 text-text-light" />
          </div>
        )}
      </section>

      {/* ── Content ── */}
      <section className="bg-white pb-20 lg:pb-0">
        <div className="max-w-7xl mx-auto px-6">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-text-muted py-1 border-b border-black/5">
            <Link href="/" className="inline-flex items-center min-h-11 hover:text-brand-deep transition-colors">Home</Link>
            <span className="text-text-light" aria-hidden="true">/</span>
            <Link href="/properties" className="inline-flex items-center min-h-11 hover:text-brand-deep transition-colors">Properties</Link>
            <span className="text-text-light" aria-hidden="true">/</span>
            <span aria-current="page" className="text-dark font-medium truncate max-w-[250px]">{property.title}</span>
          </nav>

          {/* Price bar */}
          <div className="py-8 border-b border-black/5">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-sm text-xs font-semibold uppercase tracking-wide ${
                    isLetAgreed
                      ? "bg-red-100 text-red-700"
                      : "bg-brand/15 text-brand-deep"
                  }`}
                >
                  {status}
                </span>
                {showNew && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-sm text-xs font-semibold bg-brand text-dark">
                    New Property
                  </span>
                )}
              </div>
              {/* Price leads visually, but the property title is the page's
                  h1 (SEO/screen readers); flex-col-reverse keeps the price on
                  top without reordering the DOM. */}
              <div className="flex flex-col-reverse">
                <h1 className="text-dark font-medium text-lg mt-1">
                  {property.title}
                </h1>
                <p className="font-heading text-4xl md:text-5xl font-semibold text-dark mb-2">
                  £{formatPrice(property.price)}
                  <span className="text-xl text-text-muted font-body font-normal ml-1">pcm</span>
                </p>
              </div>
              <p className="text-text-muted text-sm flex items-center gap-1.5 mt-2">
                <MapPinIcon className="w-3.5 h-3.5" />
                {property.location}
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 text-sm text-text-muted">
                <div className="flex items-center gap-1.5">
                  <BedIcon className="w-4 h-4" />
                  <span>{property.beds === 0 ? "Studio" : `${property.beds} bed`}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <BathIcon className="w-4 h-4" />
                  <span>{property.baths} bath</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <HomeIcon className="w-4 h-4" />
                  <span>{property.type}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <SofaIcon className="w-4 h-4" />
                  <span>{property.furnished || "Unfurnished"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main grid: content + sidebar */}
          <div className="grid lg:grid-cols-[1fr_340px] gap-10 lg:gap-14 py-8">
            {/* Left — details */}
            <div>
              {/* Key features */}
              {features.length > 0 && (
                <div className="pb-8 border-b border-black/5">
                  <h2 className="font-heading text-2xl font-semibold text-dark mb-5">
                    Key features
                  </h2>
                  <div className="grid sm:grid-cols-2 gap-x-10 gap-y-3">
                    {features.map((feature) => (
                      <div key={feature} className="flex items-center gap-2.5">
                        <CheckIcon className="w-4 h-4 text-brand shrink-0" />
                        <span className="text-sm text-dark">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              {property.description && (
                <div className="py-8 border-b border-black/5">
                  <h2 className="font-heading text-2xl font-semibold text-dark mb-4">
                    Description
                  </h2>
                  {isHtml(property.description) ? (
                    <ExpandableDescription html={sanitizeHtml(property.description)} />
                  ) : (
                    <ExpandableDescription plainText={property.description} />
                  )}
                </div>
              )}

              {/* Extra details — compact inline row */}
              {(extraDetails.length > 0 || property.epc_document) && (
                <div className="py-8 border-b border-black/5">
                  <h2 className="font-heading text-2xl font-semibold text-dark mb-5">
                    More information
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {extraDetails.map((row) => (
                      <div key={row.label} className="bg-cream rounded-lg px-4 py-3.5">
                        <span className="text-text-muted text-xs">{row.label}</span>
                        <p className="text-dark font-semibold text-sm mt-1">{row.value}</p>
                      </div>
                    ))}
                    {property.epc_document && (
                      <div className="bg-cream rounded-lg px-4 py-3.5">
                        <span className="text-text-muted text-xs">EPC Certificate</span>
                        <p className="mt-1">
                          <a
                            href={property.epc_document}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group inline-flex items-center min-h-11 -my-2 gap-1.5 text-brand-deep font-semibold text-sm hover:text-brand-dark transition-colors"
                          >
                            View EPC
                            <ArrowRightIcon className="w-3.5 h-3.5 shrink-0 translate-y-px transition-transform group-hover:translate-x-0.5" />
                          </a>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Map */}
              <div className="py-8">
                <h2 className="font-heading text-2xl font-semibold text-dark mb-4">
                  Location
                </h2>
                <p className="text-text-muted text-sm flex items-center gap-1.5 mb-4">
                  <MapPinIcon className="w-3.5 h-3.5 text-brand" />
                  {property.location}
                </p>
                <div className="aspect-[16/9] rounded-lg overflow-hidden border border-black/5">
                  <iframe
                    src={`https://www.google.com/maps?q=${encodeURIComponent(property.location)}&output=embed`}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title={`Map of ${property.location}`}
                  />
                </div>
                <a
                  href={`https://www.google.com/maps?q=${encodeURIComponent(property.location)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 w-full text-sm font-medium text-dark bg-white border border-black/10 rounded-lg px-4 py-3 mt-3 hover:border-brand hover:text-brand transition-all duration-200"
                >
                  <MapPinIcon className="w-4 h-4" />
                  Open in Google Maps
                </a>
              </div>
            </div>

            {/* Right — sidebar */}
            <div>
              <div className="sticky top-24 space-y-4">
                {/* Agent card */}
                <div className="bg-white rounded-lg border border-black/5 shadow-sm overflow-hidden">
                  <div className="bg-dark px-5 py-5 flex items-center justify-center">
                    <Image
                      src="/mcgowan-logo.png"
                      alt="McGowan Residential Lettings"
                      width={1709}
                      height={462}
                      className="h-10 w-auto"
                    />
                  </div>
                  <div className="p-5 space-y-2.5">
                    <a
                      href="tel:01617976967"
                      className="flex items-center justify-center gap-2 w-full border border-dark/15 text-dark font-semibold text-sm px-4 py-3 rounded-md hover:bg-dark hover:text-white transition-colors"
                    >
                      <PhoneIcon className="w-4 h-4" />
                      0161 797 6967
                    </a>
                    <a
                      href="https://wa.me/447457428720"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full bg-[#25D366] text-dark font-semibold text-sm px-4 py-3 rounded-md hover:bg-[#22c55e] transition-colors"
                    >
                      <WhatsAppIcon className="w-4 h-4" />
                      WhatsApp
                    </a>
                    <Link
                      href="/contact"
                      className="flex items-center justify-center gap-2 w-full bg-brand text-dark font-semibold text-sm px-4 py-3 rounded-md hover:bg-brand-light transition-colors"
                    >
                      <MailIcon className="w-4 h-4" />
                      Email agent
                    </Link>
                  </div>
                </div>

                {/* Back. translate-y-0.5 compensates for Plus Jakarta Sans's
                    descender depth — items-center centers against the line-
                    box midpoint, but PJS's optical text centerline sits ~2px
                    lower than that, so the icon reads as too-high without
                    this nudge. (Inter / Outfit don't need it.) */}
                <Link
                  href="/properties"
                  className="group inline-flex items-center min-h-11 gap-1.5 text-sm font-medium text-text-muted hover:text-brand-deep transition-colors"
                >
                  <ArrowLeftIcon className="w-3.5 h-3.5 shrink-0 translate-y-px transition-transform group-hover:-translate-x-0.5" />
                  Back to all properties
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Sticky Mobile CTA ── */}
      {/* Below lg the fixed bar covers the bottom ~5rem of the viewport, so
          keyboard focus scrolled into view there would hide under it. :has()
          scopes the padding to pages with the bar (progressive enhancement:
          Safari 15.4+, Chrome 105+, Firefox 121+). React hoists this to head. */}
      <style href="property-sticky-bar-scroll-padding" precedence="default">
        {"@media (max-width: 1023.98px){html:has(.property-sticky-bar){scroll-padding-bottom:5.5rem}}"}
      </style>
      <div className="property-sticky-bar fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-black/10 px-4 py-3 flex items-center gap-2 lg:hidden">
        <a
          href="tel:01617976967"
          className="flex-1 flex items-center justify-center gap-2 border border-dark/15 text-dark font-semibold text-sm py-3 rounded-md"
        >
          <PhoneIcon className="w-4 h-4" />
          Call
        </a>
        <a
          href="https://wa.me/447457428720"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] text-dark font-semibold text-sm py-3 rounded-md"
        >
          <WhatsAppIcon className="w-4 h-4" />
          WhatsApp
        </a>
        <Link
          href="/contact"
          className="flex-1 flex items-center justify-center gap-2 bg-brand text-dark font-semibold text-sm py-3 rounded-md"
        >
          <MailIcon className="w-4 h-4" />
          Email
        </Link>
      </div>

      {/* ── Similar Properties ── */}
      {similarProperties && similarProperties.length >= 2 && (
        <section className="bg-cream py-16 md:py-24 border-t border-black/5">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-heading text-2xl font-semibold text-dark">
                Similar properties
              </h2>
              <Link
                href="/properties"
                className="group inline-flex items-center min-h-11 gap-1.5 text-sm font-semibold text-text-muted hover:text-brand-deep transition-colors"
              >
                View all
                <ArrowRightIcon className="w-3.5 h-3.5 shrink-0 translate-y-px transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {similarProperties.map((p) => (
                <Link href={`/properties/${p.id}`} key={p.id}>
                  <article className="property-card group bg-white rounded-lg border border-black/5 shadow-sm overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-lg">
                    <div className="relative aspect-[4/3] overflow-hidden bg-warm-grey">
                      <CardImage
                        src={p.images?.[0] ? thumbUrl(p.images[0]) : "/hero-banner.jpg"}
                        alt={cardAlt(p.title, p.location)}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="property-image object-cover transition-transform duration-700 ease-out"
                      />
                      <div className="absolute bottom-3 left-3 bg-dark/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-sm">
                        <span className="text-lg font-semibold">£{formatPrice(p.price)}</span>
                        <span className="text-white/50 text-xs ml-1">pcm</span>
                      </div>
                      <PropertyCardBadge status={p.status} isNew={p.is_new} />
                    </div>
                    <div className="p-5">
                      <h3 className="font-semibold text-dark mb-1 group-hover:text-brand-dark transition-colors">
                        {p.title}
                      </h3>
                      {locationDiffersFromTitle(p.title, p.location) && (
                        <div className="flex items-center gap-1 text-text-muted text-sm">
                          <MapPinIcon className="w-3.5 h-3.5 shrink-0" />
                          {p.location}
                        </div>
                      )}
                      <div className="flex items-center gap-4 pt-4 mt-4 border-t border-black/5">
                        <div className="flex items-center gap-1.5 text-sm text-text-muted">
                          <BedIcon className="w-4 h-4" />
                          <span>{p.beds === 0 ? "Studio" : `${p.beds} ${p.beds === 1 ? "Bed" : "Beds"}`}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-text-muted">
                          <BathIcon className="w-4 h-4" />
                          <span>{p.baths} {p.baths === 1 ? "Bath" : "Baths"}</span>
                        </div>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
