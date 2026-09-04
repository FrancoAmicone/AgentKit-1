/** Local listing photos (Wikimedia Commons) so cards never depend on Unsplash. */

export const LISTING_PHOTOS = {
  "bariloche-cabin": "/listings/bariloche-cabin.jpg",
  "bariloche-lakehouse": "/listings/bariloche-lake.jpg",
  "mendoza-vineyard": "/listings/mendoza-vineyard.jpg",
  "ushuaia-loft": "/listings/ushuaia.jpg",
  "salta-adobe": "/listings/salta.jpg",
  "pinamar-beach": "/listings/pinamar.jpg",
  "cordoba-sierra": "/listings/cordoba.jpg",
  "palermo-studio": "/listings/palermo.jpg",
  "iguazu-house": "/listings/iguazu.jpg",
  "elcalafate-view": "/listings/calafate.jpg",
  "mardelplata-balcon": "/listings/mardelplata.jpg",
  "rosario-river": "/listings/rosario.jpg",
} as const;

export const HOST_FALLBACK_PHOTOS = [
  "/listings/bariloche-cabin.jpg",
  "/listings/mendoza-vineyard.jpg",
  "/listings/ushuaia.jpg",
  "/listings/palermo.jpg",
  "/listings/cordoba.jpg",
  "/listings/pinamar.jpg",
] as const;

export const FALLBACK_LISTING_PHOTO = "/listings/bariloche-cabin.jpg";

export function mapsSearchUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function isAllowedImageUrl(value: string): boolean {
  return /^https:\/\//.test(value) || value.startsWith("/listings/");
}
