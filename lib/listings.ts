import { LISTINGS_SEED, type Listing, type ListingFilters } from "./listings-data";

/** In-memory availability (resets on server restart — fine for Phase 1). */
const availability = new Map<string, boolean>(
  LISTINGS_SEED.map((l) => [l.id, l.available]),
);

function marketplaceAddress(): string {
  return (
    process.env.MARKETPLACE_WALLET_ADDRESS ||
    LISTINGS_SEED[0]?.ownerWalletAddress ||
    "0x0000000000000000000000000000000000000001"
  );
}

export function getAllListings(): Listing[] {
  const payTo = marketplaceAddress();
  return LISTINGS_SEED.map((l) => ({
    ...l,
    ownerWalletAddress: payTo,
    available: availability.get(l.id) ?? l.available,
  }));
}

export function getListing(id: string): Listing | undefined {
  return getAllListings().find((l) => l.id === id);
}

export function filterListings(filters: ListingFilters): Listing[] {
  const destino = filters.destino?.toLowerCase().trim();
  const amenities = (filters.amenities || []).map((a) => a.toLowerCase());

  return getAllListings().filter((l) => {
    if (!l.available) return false;

    if (destino) {
      const haystack = `${l.title} ${l.location}`.toLowerCase();
      const tokens = destino.split(/\s+/).filter(Boolean);
      if (!tokens.some((t) => haystack.includes(t))) return false;
    }

    if (typeof filters.precioMax === "number" && l.pricePerNight > filters.precioMax) {
      return false;
    }

    if (amenities.length > 0) {
      const listingAmenities = l.amenities.map((a) => a.toLowerCase());
      if (!amenities.every((a) => listingAmenities.some((x) => x.includes(a)))) {
        return false;
      }
    }

    return true;
  });
}

export function reserveListing(id: string): Listing | undefined {
  const listing = getListing(id);
  if (!listing || !listing.available) return undefined;
  availability.set(id, false);
  return { ...listing, available: false };
}

export function resetAvailability() {
  for (const l of LISTINGS_SEED) {
    availability.set(l.id, true);
  }
}
