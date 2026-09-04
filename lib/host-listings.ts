import { randomBytes } from "node:crypto";
import { isDateStr, type DateRange } from "./dates";
import { readDemoStore, writeDemoStore } from "./demo-store";
import type { Listing } from "./listings-data";
import { HOST_FALLBACK_PHOTOS, isAllowedImageUrl } from "./listing-images";

/** A listing published from the host side, owned by an anonymous host session. */
export type HostListing = Listing & {
  hostId: string;
  createdAt: string;
  /**
   * Optional per-property override of the payout wallet. When absent, the
   * host's profile wallet applies (lib/host-profile.ts), then marketplace.
   */
  payoutAddress?: string;
};

export type NewHostListingInput = {
  title: string;
  location: string;
  description: string;
  pricePerNight: number;
  amenities: string[];
  imageUrl?: string;
  maxGuests: number;
  payoutAddress?: string;
  availabilityWindows?: DateRange[];
};

const MAX_AVAILABILITY_WINDOWS = 12;
const STORE_NAME = "host-listings";

/** Validates + normalizes host-provided availability windows (sorted). */
export function normalizeAvailabilityWindows(
  input: unknown,
): DateRange[] | undefined {
  if (input == null) return undefined;
  if (!Array.isArray(input)) {
    throw new Error("availabilityWindows debe ser una lista de rangos.");
  }
  if (input.length === 0) return undefined;
  if (input.length > MAX_AVAILABILITY_WINDOWS) {
    throw new Error(`Máximo ${MAX_AVAILABILITY_WINDOWS} ventanas de disponibilidad.`);
  }
  const windows = input.map((raw) => {
    const w = raw as { checkIn?: unknown; checkOut?: unknown };
    if (!isDateStr(w?.checkIn) || !isDateStr(w?.checkOut)) {
      throw new Error("Cada ventana necesita fechas YYYY-MM-DD (desde / hasta).");
    }
    if (w.checkIn >= w.checkOut) {
      throw new Error("En cada ventana, el fin debe ser posterior al inicio.");
    }
    return { checkIn: w.checkIn, checkOut: w.checkOut };
  });
  return windows.sort((a, b) => a.checkIn.localeCompare(b.checkIn));
}

const FALLBACK_IMAGES = HOST_FALLBACK_PHOTOS;

export const MIN_PRICE_PER_NIGHT_USDC = 0.01;
export const MAX_PRICE_PER_NIGHT_USDC = 10_000;

type StoreFile = {
  listings: HostListing[];
};

async function readStore(): Promise<StoreFile> {
  const parsed = await readDemoStore<StoreFile>(STORE_NAME, { listings: [] });
  if (!Array.isArray(parsed?.listings)) return { listings: [] };
  return parsed;
}

async function writeStore(store: StoreFile): Promise<void> {
  await writeDemoStore(STORE_NAME, store);
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
}

export function isEvmAddress(value: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

export async function getAllHostListings(): Promise<HostListing[]> {
  const store = await readStore();
  return store.listings;
}

export async function getHostListingsByHost(hostId: string): Promise<HostListing[]> {
  const store = await readStore();
  return store.listings
    .filter((l) => l.hostId === hostId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createHostListing(
  hostId: string,
  input: NewHostListingInput,
): Promise<HostListing> {
  const title = input.title.trim();
  const location = input.location.trim();
  const description = input.description.trim();

  if (title.length < 3) throw new Error("El título debe tener al menos 3 caracteres.");
  if (location.length < 3) throw new Error("Indicá la ciudad y provincia (ej: Bariloche, Río Negro).");
  if (description.length < 10) throw new Error("Contá un poco más del lugar (mínimo 10 caracteres).");
  if (
    !Number.isFinite(input.pricePerNight) ||
    input.pricePerNight < MIN_PRICE_PER_NIGHT_USDC ||
    input.pricePerNight > MAX_PRICE_PER_NIGHT_USDC
  ) {
    throw new Error(
      `El precio por noche debe estar entre $${MIN_PRICE_PER_NIGHT_USDC} y $${MAX_PRICE_PER_NIGHT_USDC} USDC.`,
    );
  }
  const maxGuests = Math.round(input.maxGuests);
  if (!Number.isFinite(maxGuests) || maxGuests < 1 || maxGuests > 20) {
    throw new Error("Huéspedes: entre 1 y 20.");
  }
  const payoutAddress = input.payoutAddress?.trim();
  if (payoutAddress && !isEvmAddress(payoutAddress)) {
    throw new Error("La wallet de cobro debe ser una dirección EVM válida (0x…).");
  }
  const imageUrl = input.imageUrl?.trim();
  if (imageUrl && !isAllowedImageUrl(imageUrl)) {
    throw new Error("La imagen debe ser una URL https o una foto local de /listings/.");
  }

  const amenities = input.amenities
    .map((a) => a.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 8);

  const availabilityWindows = normalizeAvailabilityWindows(input.availabilityWindows);

  const store = await readStore();
  const id = `${slugify(title) || "propiedad"}-${randomBytes(3).toString("hex")}`;

  const listing: HostListing = {
    id,
    title,
    location,
    description,
    pricePerNight: input.pricePerNight,
    amenities,
    rating: 5,
    imageUrl:
      imageUrl || FALLBACK_IMAGES[store.listings.length % FALLBACK_IMAGES.length],
    maxGuests,
    ownerWalletAddress: payoutAddress || "",
    source: "host",
    hostId,
    createdAt: new Date().toISOString(),
    payoutAddress: payoutAddress || undefined,
    availabilityWindows,
  };

  store.listings.push(listing);
  await writeStore(store);
  return listing;
}

export type HostListingPatch = {
  /** New windows; empty array clears them (property always offered). */
  availabilityWindows?: DateRange[];
  /** Per-property payout override; empty string clears it (host wallet applies). */
  payoutAddress?: string;
};

/** Update availability windows and/or payout override for one of the host's listings. */
export async function updateHostListing(
  hostId: string,
  listingId: string,
  patch: HostListingPatch,
): Promise<HostListing> {
  const store = await readStore();
  const listing = store.listings.find(
    (l) => l.id === listingId && l.hostId === hostId,
  );
  if (!listing) {
    throw new Error("Propiedad no encontrada para este anfitrión.");
  }

  if ("availabilityWindows" in patch) {
    listing.availabilityWindows = normalizeAvailabilityWindows(
      patch.availabilityWindows,
    );
  }

  if ("payoutAddress" in patch) {
    const trimmed = String(patch.payoutAddress ?? "").trim();
    if (trimmed && !isEvmAddress(trimmed)) {
      throw new Error("La wallet de cobro debe ser una dirección EVM válida (0x…).");
    }
    listing.payoutAddress = trimmed || undefined;
    listing.ownerWalletAddress = trimmed || "";
  }

  await writeStore(store);
  return listing;
}

export async function deleteHostListing(hostId: string, listingId: string): Promise<boolean> {
  const store = await readStore();
  const before = store.listings.length;
  store.listings = store.listings.filter(
    (l) => !(l.id === listingId && l.hostId === hostId),
  );
  if (store.listings.length === before) return false;
  await writeStore(store);
  return true;
}
