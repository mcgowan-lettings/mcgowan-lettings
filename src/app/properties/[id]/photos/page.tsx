import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { getProperty } from "../get-property";
import { ArrowLeftIcon, MapPinIcon } from "@/components/Icons";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

// Bulletproof SSR fallback for the photo lightbox. Fancybox is a progressive
// enhancement on the property detail page — when it doesn't bind (older
// browsers, blocked chunks, or something weird in iPadOS 16 Safari that we
// hit with David's iPad), the "View all N photos" badge falls through to its
// href, which is this page. Renders every photo in a simple responsive grid;
// each thumbnail still opens the full image in a new tab.

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const property = await getProperty(id);
  if (!property) {
    return { title: "Photos Not Found | McGowan Lettings" };
  }
  return {
    title: `Photos — ${property.title} | McGowan Lettings`,
    // Don't index the gallery view; the canonical entity is the property page.
    robots: { index: false, follow: true },
    alternates: { canonical: `/properties/${id}` },
  };
}

export default async function PropertyPhotosPage({ params }: Props) {
  const { id } = await params;
  const property = await getProperty(id);

  if (!property || !property.active) {
    notFound();
  }

  const images: string[] = property.images ?? [];

  if (images.length === 0) {
    notFound();
  }

  return (
    <section className="bg-cream pt-24 md:pt-28 pb-20">
      <div className="max-w-6xl mx-auto px-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-text-muted mb-6">
          <Link href="/" className="hover:text-brand transition-colors">
            Home
          </Link>
          <span className="text-text-light">/</span>
          <Link href="/properties" className="hover:text-brand transition-colors">
            Properties
          </Link>
          <span className="text-text-light">/</span>
          <Link
            href={`/properties/${id}`}
            className="hover:text-brand transition-colors truncate max-w-[200px]"
          >
            {property.title}
          </Link>
          <span className="text-text-light">/</span>
          <span className="text-dark font-medium">Photos</span>
        </nav>

        {/* Heading */}
        <div className="mb-8">
          <h1 className="font-heading text-3xl md:text-4xl font-semibold text-dark mb-2">
            {property.title}
          </h1>
          <p className="text-text-muted text-sm flex items-center gap-1.5">
            <MapPinIcon className="w-3.5 h-3.5" />
            {property.location} · {images.length}{" "}
            {images.length === 1 ? "photo" : "photos"}
          </p>
        </div>

        {/* Photo grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {images.map((src, i) => (
            <a
              key={i}
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              className="relative aspect-[4/3] overflow-hidden rounded-lg bg-warm-grey block group hover:opacity-95 transition-opacity"
            >
              <Image
                src={src}
                alt={`${property.title} — photo ${i + 1} of ${images.length}`}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                quality={85}
                className="object-cover"
                priority={i < 3}
              />
              <div className="absolute bottom-2 right-2 bg-dark/70 backdrop-blur-sm text-white text-xs font-medium px-2 py-1 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity">
                {i + 1} / {images.length}
              </div>
            </a>
          ))}
        </div>

        {/* Back to property */}
        <div className="mt-12">
          <Link
            href={`/properties/${id}`}
            className="group inline-flex items-center gap-1.5 text-sm font-medium text-text-muted hover:text-brand transition-colors"
          >
            <ArrowLeftIcon className="w-3.5 h-3.5 shrink-0 translate-y-px transition-transform group-hover:-translate-x-0.5" />
            Back to {property.title}
          </Link>
        </div>
      </div>
    </section>
  );
}
