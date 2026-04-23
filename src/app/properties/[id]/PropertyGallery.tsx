"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Fancybox } from "@fancyapps/ui";
import "@fancyapps/ui/dist/fancybox/fancybox.css";
import VideoLightbox from "./VideoLightbox";

export default function PropertyGallery({
  images,
  videos = [],
  title,
}: {
  images: string[];
  videos?: string[];
  title: string;
}) {
  const [tourOpen, setTourOpen] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (Fancybox.bind as any)("[data-fancybox='gallery']", {
      animated: true,
      hideScrollbar: false,
      Thumbs: { type: "classic" },
    });

    return () => {
      Fancybox.destroy();
    };
  }, []);

  const tourUrl = videos[0];

  const renderTourButton = () =>
    tourUrl ? (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setTourOpen(true);
        }}
        className="absolute z-10 top-4 left-4 flex items-center gap-2.5 rounded-full bg-dark/90 backdrop-blur-sm text-white font-semibold shadow-lg hover:bg-brand hover:text-dark transition-colors px-4 py-2.5 text-sm"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-dark">
          <svg className="h-3.5 w-3.5 translate-x-[1px]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7L8 5z" />
          </svg>
        </span>
        Virtual Tour
      </button>
    ) : null;

  return (
    <>
      {images.length === 0 ? (
        <div className="relative w-full h-[45vh] md:h-[55vh] max-h-[550px] bg-warm-grey flex items-center justify-center">
          {renderTourButton()}
        </div>
      ) : images.length === 1 ? (
        <div className="relative w-full h-[45vh] md:h-[55vh] max-h-[550px]">
          <a
            href={images[0]}
            data-fancybox="gallery"
            data-no-caption={title}
            className="relative block w-full h-full cursor-pointer group"
          >
            <Image
              src={images[0]}
              alt={title}
              fill
              sizes="100vw"
              quality={85}
              className="object-cover"
              priority
            />
            <div className="absolute bottom-4 right-4 bg-white text-dark text-xs font-semibold px-3 py-2 rounded-md shadow-sm flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
              </svg>
              View photo
            </div>
          </a>
          {renderTourButton()}
        </div>
      ) : images.length === 2 ? (
        <div className="relative w-full h-[45vh] md:h-[55vh] max-h-[550px] grid grid-cols-2 gap-1">
          {images.map((img, i) => (
            <a
              key={i}
              href={img}
              data-fancybox="gallery"
              data-no-caption={`${title} — ${i + 1} of ${images.length}`}
              className="relative group"
            >
              <Image
                src={img}
                alt={`${title} — ${i + 1}`}
                fill
                sizes="50vw"
                quality={85}
                className="object-cover group-hover:brightness-[0.92] transition-all duration-300"
                priority={i === 0}
              />
            </a>
          ))}
          <div className="absolute bottom-4 right-4 bg-white text-dark text-xs font-semibold px-3 py-2 rounded-md shadow-sm flex items-center gap-1.5 pointer-events-none">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91M3.75 21h16.5a2.25 2.25 0 002.25-2.25V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
            </svg>
            {images.length} photos
          </div>
          {renderTourButton()}
        </div>
      ) : (
        <div className="relative w-full h-[45vh] md:h-[55vh] max-h-[550px] grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-1">
          {/* Main image */}
          <a
            href={images[0]}
            data-fancybox="gallery"
            data-no-caption={`${title} — 1 of ${images.length}`}
            className="relative group"
          >
            <Image
              src={images[0]}
              alt={`${title} — 1`}
              fill
              sizes="(max-width: 768px) 100vw, 66vw"
              quality={85}
              className="object-cover group-hover:brightness-[0.92] transition-all duration-300"
              priority
            />
          </a>

          {/* Side images */}
          <div className="hidden md:grid grid-rows-2 gap-1">
            {images.slice(1, 3).map((img, i) => (
              <a
                key={i}
                href={img}
                data-fancybox="gallery"
                data-no-caption={`${title} — ${i + 2} of ${images.length}`}
                className="relative group"
              >
                <Image
                  src={img}
                  alt={`${title} — ${i + 2}`}
                  fill
                  sizes="34vw"
                  quality={80}
                  className="object-cover group-hover:brightness-[0.92] transition-all duration-300"
                />
                {i === 1 && images.length > 3 && (
                  <div className="absolute inset-0 bg-dark/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white font-semibold text-sm">+{images.length - 3} more</span>
                  </div>
                )}
              </a>
            ))}
          </div>

          {/* Hidden images for fancybox (so all images are in the gallery) */}
          {images.slice(3).map((img, i) => (
            <a
              key={i + 3}
              href={img}
              data-fancybox="gallery"
              data-no-caption={`${title} — ${i + 4} of ${images.length}`}
              className="hidden"
            >
              {img}
            </a>
          ))}

          {/* Photo count — clickable to open gallery */}
          <a
            href={images[0]}
            data-fancybox="gallery-trigger"
            className="absolute bottom-4 right-4 bg-white text-dark text-xs font-semibold px-3 py-2 rounded-md shadow-sm flex items-center gap-1.5 z-10 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={(e) => {
              e.preventDefault();
              const firstLink = document.querySelector<HTMLAnchorElement>('[data-fancybox="gallery"]');
              firstLink?.click();
            }}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91M3.75 21h16.5a2.25 2.25 0 002.25-2.25V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
            </svg>
            View all {images.length} photos
          </a>

          {renderTourButton()}
        </div>
      )}
      {tourOpen && tourUrl && (
        <VideoLightbox src={tourUrl} onClose={() => setTourOpen(false)} />
      )}
    </>
  );
}
