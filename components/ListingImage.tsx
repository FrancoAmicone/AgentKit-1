"use client";

import { useState } from "react";
import { FALLBACK_LISTING_PHOTO } from "@/lib/listing-images";

type Props = {
  src: string;
  alt: string;
  className?: string;
};

/** Catalog photo with a local fallback if the URL 404s or is blocked. */
export function ListingImage({ src, alt, className }: Props) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const current =
    !src || failedSrc === src ? FALLBACK_LISTING_PHOTO : src;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={current}
      alt={alt}
      className={className}
      onError={() => {
        if (src && src !== FALLBACK_LISTING_PHOTO) {
          setFailedSrc(src);
        }
      }}
    />
  );
}
