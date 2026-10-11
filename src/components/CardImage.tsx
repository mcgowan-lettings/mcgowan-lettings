"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

const FALLBACK = "/hero-banner.jpg";

/**
 * Property-card photo that swaps to the generic banner if the file is
 * missing (deleted from Storage, bad URL), instead of a broken-image icon.
 * next/image re-fires errors that happened before hydration, so this also
 * catches failures on the server-rendered first paint.
 */
export default function CardImage({ src, alt, ...rest }: Omit<ImageProps, "src" | "onError"> & { src: string }) {
  // Keyed on the failing src, so a new src (e.g. filters re-using a card)
  // gets a fresh attempt without an effect.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const effective = failedSrc === src ? FALLBACK : src;
  return (
    <Image
      {...rest}
      src={effective}
      alt={alt}
      onError={() => {
        if (src !== FALLBACK) setFailedSrc(src);
      }}
    />
  );
}
