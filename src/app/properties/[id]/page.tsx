import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase-server";
import PropertyGallery from "./PropertyGallery";
import ExpandableDescription from "./ExpandableDescription";
import {
  BedIcon,
  BathIcon,
  MapPinIcon,
  PhoneIcon,
  WhatsAppIcon,
  MailIcon,
  HomeIcon,
  CheckIcon,
} from "@/components/Icons";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function PropertyDetailPage({ params }: Props) {
  const { id } = await params;

  const { data: property, error } = await supabaseAdmin
    .from("properties")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !property || !property.active) {
    notFound();
  }

  const { data: similarProperties } = await supabaseAdmin
    .from("properties")
    .select("id, title, price, location, beds, baths, type, images, status")
    .eq("active", true)
    .neq("id", id)
    .or(`area.eq.${property.area},type.eq.${property.type}`)
    .limit(3);

  const images: string[] = property.images ?? [];
  const hasImages = images.length > 0;

  // Show database features, or sensible defaults for showcase
  const dbFeatures: string[] = property.features ?? [];
  const features = dbFeatures.length > 0 ? dbFeatures : [
    "Double glazed throughout",
    "Gas central heating",
    "Modern fitted kitchen",
    "Close to local amenities",
    property.furnished || "Unfurnished",
    `${property.beds} ${property.beds === 1 ? "bedroom" : "bedrooms"}`,
  ];

  const status = property.status || "To Let";
  const isLetAgreed = status === "Let Agreed";

  // Extra details — only fields that aren't already in the price bar
  const extraDetails: { label: string; value: string }[] = [];
  if (property.available_from) {
    extraDetails.push({
      label: "Available From",
      value: new Date(property.available_from).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    });
  }
  if (property.council_tax_band) {
    extraDetails.push({ label: "Council Tax Band", value: property.council_tax_band });
  }

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: property.title,
    description: property.description || `${property.title} in ${property.location}`,
    url: `https://mcgowanlettings.co.uk/properties/${id}`,
    image: images[0] || undefined,
    offers: {
      "@type": "Offer",
      price: property.price,
      priceCurrency: "GBP",
      availability: status === "Let Agreed" ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: property.location,
      addressRegion: "Greater Manchester",
      addressCountry: "GB",
    },
    numberOfRooms: property.beds,
    numberOfBathroomsTotal: property.baths,
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://mcgowanlettings.co.uk" },
      { "@type": "ListItem", position: 2, name: "Properties", item: "https://mcgowanlettings.co.uk/properties" },
      { "@type": "ListItem", position: 3, name: property.title },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      {/* ── Gallery — full width ── */}
      <section className="bg-dark pt-16">
        {hasImages ? (
          <PropertyGallery images={images} title={property.title} />
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
          <nav className="flex items-center gap-1.5 text-sm text-text-muted py-4 border-b border-black/5">
            <Link href="/" className="hover:text-brand transition-colors">Home</Link>
            <span className="text-text-light">/</span>
            <Link href="/properties" className="hover:text-brand transition-colors">Properties</Link>
            <span className="text-text-light">/</span>
            <span className="text-dark font-medium truncate max-w-[250px]">{property.title}</span>
          </nav>

          {/* Price bar */}
          <div className="py-8 border-b border-black/5">
            <div>
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-sm text-xs font-semibold uppercase tracking-wide mb-3 ${
                  isLetAgreed
                    ? "bg-red-100 text-red-700"
                    : "bg-brand/15 text-brand-dark"
                }`}
              >
                {status}
              </span>
              <h1 className="font-heading text-4xl md:text-5xl font-semibold text-dark mb-2">
                £{property.price?.toLocaleString()}
                <span className="text-xl text-text-muted font-body font-normal ml-1">pcm</span>
              </h1>
              <p className="text-dark font-medium text-lg mt-1">
                {property.title}
              </p>
              <p className="text-text-muted text-sm flex items-center gap-1.5 mt-2">
                <MapPinIcon className="w-3.5 h-3.5" />
                {property.location}
              </p>
              <div className="flex items-center gap-4 mt-4 text-sm text-text-muted">
                <div className="flex items-center gap-1.5">
                  <BedIcon className="w-4 h-4" />
                  <span>{property.beds} bed</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <BathIcon className="w-4 h-4" />
                  <span>{property.baths} bath</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <HomeIcon className="w-4 h-4" />
                  <span>{property.type}</span>
                </div>
                <span className="text-black/10">|</span>
                <span>{property.furnished || "Unfurnished"}</span>
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
                  <ExpandableDescription text={property.description} />
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
                            className="text-brand-dark font-semibold text-sm hover:underline"
                          >
                            View EPC →
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
                      className="flex items-center justify-center gap-2 w-full bg-[#25D366] text-white font-semibold text-sm px-4 py-3 rounded-md hover:bg-[#22c55e] transition-colors"
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

                {/* Back */}
                <Link
                  href="/properties"
                  className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-brand transition-colors"
                >
                  ← Back to all properties
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Sticky Mobile CTA ── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-black/10 px-4 py-3 flex items-center gap-2 lg:hidden">
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
          className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] text-white font-semibold text-sm py-3 rounded-md"
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
        <section className="bg-cream py-16 md:py-24 pb-28 lg:pb-24 border-t border-black/5">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-heading text-2xl font-semibold text-dark">
                Similar properties
              </h2>
              <Link
                href="/properties"
                className="text-sm font-semibold text-text-muted hover:text-brand transition-colors"
              >
                View all →
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {similarProperties.map((p) => (
                <Link href={`/properties/${p.id}`} key={p.id}>
                  <article className="property-card group bg-white rounded-lg border border-black/5 overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-lg">
                    <div className="relative aspect-[4/3] overflow-hidden bg-warm-grey">
                      <Image
                        src={p.images?.[0] || "/hero.jpg"}
                        alt={p.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="property-image object-cover transition-transform duration-700 ease-out"
                      />
                      <div className="absolute bottom-3 left-3 bg-dark/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-sm">
                        <span className="text-lg font-semibold">£{p.price.toLocaleString()}</span>
                        <span className="text-white/50 text-xs ml-1">pcm</span>
                      </div>
                      {p.status && p.status !== "To Let" && (
                        <div className="absolute top-3 left-3 bg-red-600 text-white text-xs font-semibold px-2.5 py-1 rounded-sm">
                          {p.status}
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <h3 className="font-semibold text-dark mb-1 group-hover:text-brand-dark transition-colors">
                        {p.title}
                      </h3>
                      <div className="flex items-center gap-1 text-text-muted text-sm mb-4">
                        <MapPinIcon className="w-3.5 h-3.5" />
                        {p.location}
                      </div>
                      <div className="flex items-center gap-4 pt-4 border-t border-black/5">
                        <div className="flex items-center gap-1.5 text-sm text-text-muted">
                          <BedIcon className="w-4 h-4" />
                          <span>{p.beds} {p.beds === 1 ? "Bed" : "Beds"}</span>
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
