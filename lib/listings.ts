import { LISTINGS_SEED, type Listing, type ListingFilters } from "./listings-data";
import {
  getAllHostListings,
  isEvmAddress,
  type HostListing,
} from "./host-listings";
import { getAllHostProfiles } from "./host-profile";
import { seedAvailabilityWindows } from "./seed-availability";
import {
  isRangeFree,
  stayWithinAvailability,
  validateStayRange,
} from "./bookings";

function marketplaceAddress(): string {
  return (
    process.env.MARKETPLACE_WALLET_ADDRESS ||
    LISTINGS_SEED[0]?.ownerWalletAddress ||
    "0x0000000000000000000000000000000000000001"
  );
}

export type ListingPayout = {
  address: string;
  source: "listing" | "host" | "marketplace";
  /** True when the address is a real EVM wallet (vs placeholder). */
  isEvm: boolean;
};

/**
 * Where x402 will settle USDC for this listing.
 * Same resolution used by the /buy route (must stay in sync).
 */
export async function resolveListingPayTo(listing: Listing): Promise<ListingPayout> {
  const fallback = marketplaceAddress();

  if (listing.source === "host") {
    const hostListing = listing as HostListing;
    if (hostListing.payoutAddress && isEvmAddress(hostListing.payoutAddress)) {
      return {
        address: hostListing.payoutAddress,
        source: "listing",
        isEvm: true,
      };
    }
    if (hostListing.hostId) {
      const profiles = await getAllHostProfiles();
      const hostWallet = profiles.get(hostListing.hostId)?.payoutAddress;
      if (hostWallet && isEvmAddress(hostWallet)) {
        return { address: hostWallet, source: "host", isEvm: true };
      }
    }
  }

  return {
    address: fallback,
    source: "marketplace",
    isEvm: isEvmAddress(fallback),
  };
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
  const [hostListings, hostProfiles] = await Promise.all([
    getAllHostListings(),
    getAllHostProfiles(),
  ]);
  const fallbackPayTo = marketplaceAddress();
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
    availabilityWindows:
      l.availabilityWindows && l.availabilityWindows.length > 0
        ? l.availabilityWindows
        : seedAvailabilityWindows(l.id),
  }));
  return [...host, ...seed];
}

export async function getListing(id: string): Promise<Listing | undefined> {
  const listings = await getAllListings();
  return listings.find((l) => l.id === id);
}

/**
 * Text/price/amenity filters first. If checkIn+checkOut are valid, keep only
 * listings that offer every night of the stay and have those nights free.
 */
export async function filterListings(filters: ListingFilters): Promise<Listing[]> {
  const destino = filters.destino?.toLowerCase().trim();
  const amenities = (filters.amenities || []).map((a) => a.toLowerCase());
  const listings = await getAllListings();

  const textMatched = listings.filter((l) => {
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

  const stay = validateStayRange(filters.checkIn, filters.checkOut);
  if (!stay.ok) return textMatched;

  const range = { checkIn: stay.checkIn, checkOut: stay.checkOut };
  const fits = await Promise.all(
    textMatched.map(async (listing) => {
      if (!stayWithinAvailability(listing.availabilityWindows, range)) return null;
      return (await isRangeFree(listing.id, range)) ? listing : null;
    }),
  );
  return fits.filter((listing): listing is Listing => listing != null);
}
