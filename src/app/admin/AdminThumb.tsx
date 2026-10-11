"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { thumbUrl } from "@/lib/thumb";

/**
 * Small admin preview of a property/blog photo. Loads the ~640px thumbnail
 * twin (see src/lib/thumb.ts) and falls back to the original if the thumb is
 * missing (e.g. an upload whose thumbnail failed). Non-photo URLs (Unsplash,
 * blog covers) pass through thumbUrl unchanged.
 */
export default function AdminThumb({ src, alt, ...rest }: Omit<ImageProps, "src" | "onError"> & { src: string }) {
  // Keyed on the original src so a new photo gets a fresh thumb attempt.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const thumb = thumbUrl(src);
  const effective = failedSrc === src ? src : thumb;
  return (
    <Image
      {...rest}
      src={effective}
      alt={alt}
      onError={() => {
        if (effective !== src) setFailedSrc(src);
      }}
    />
  );
}
