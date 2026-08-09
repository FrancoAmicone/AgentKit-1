import { LISTINGS_SEED, type Listing, type ListingFilters } from "./listings-data";
import { getAllHostListings } from "./host-listings";
import { getAllHostProfiles } from "./host-profile";

function marketplaceAddress(): string {
  return (
    process.env.MARKETPLACE_WALLET_ADDRESS ||
    LISTINGS_SEED[0]?.ownerWalletAddress ||
    "0x0000000000000000000000000000000000000001"
  );
}

/**
 * Full public catalog: host-published listings first, then the demo seed.
 *
 * payTo resolution per listing (see docs/15-host-payouts-and-availability.md):
 *   1. per-listing override (payoutAddress on the listing)
 *   2. host profile wallet (registered once, anchors all their properties)
 *   3. marketplace wallet (single-wallet default)
 */
export async function getAllListings(): Promise<Listing[]> {
  const fallbackPayTo = marketplaceAddress();
  const [hostListings, hostProfiles] = await Promise.all([
    getAllHostListings(),
    getAllHostProfiles(),
  ]);
  const host = hostListings.map((l) => ({
    ...l,
    ownerWalletAddress:
      l.payoutAddress ||
      hostProfiles.get(l.hostId)?.payoutAddress ||
      fallbackPayTo,
  }));
  const seed = LISTINGS_SEED.map((l) => ({
    ...l,
    ownerWalletAddress: fallbackPayTo,
  }));
  return [...host, ...seed];
}

export async function getListing(id: string): Promise<Listing | undefined> {
  const listings = await getAllListings();
  return listings.find((l) => l.id === id);
}

/**
 * Availability is date-based now (see lib/bookings.ts) — a listing always
 * appears in search; specific nights get locked by bookings.
 */
export async function filterListings(filters: ListingFilters): Promise<Listing[]> {
  const destino = filters.destino?.toLowerCase().trim();
  const amenities = (filters.amenities || []).map((a) => a.toLowerCase());
  const listings = await getAllListings();

  return listings.filter((l) => {
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
