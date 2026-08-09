import { randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { Listing } from "./listings-data";

/** A listing published from the host side, owned by an anonymous host session. */
export type HostListing = Listing & {
  hostId: string;
  createdAt: string;
  /** Optional wallet the host set to receive x402 payments. */
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
};

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80",
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80",
];

export const MIN_PRICE_PER_NIGHT_USDC = 0.01;
export const MAX_PRICE_PER_NIGHT_USDC = 10_000;

type StoreFile = {
  listings: HostListing[];
};

function storePath(): string {
  // Demo-only: Vercel FS is read-only except /tmp (not durable).
  // See docs/11-demo-tradeoffs.md.
  if (process.env.VERCEL) {
    return join("/tmp", "stay-agent-host-listings.json");
  }
  return join(process.cwd(), "data", "host-listings.json");
}

async function readStore(): Promise<StoreFile> {
  try {
    const raw = await readFile(storePath(), "utf8");
    const parsed = JSON.parse(raw) as StoreFile;
    if (!Array.isArray(parsed?.listings)) return { listings: [] };
    return parsed;
  } catch {
    return { listings: [] };
  }
}

async function writeStore(store: StoreFile): Promise<void> {
  const path = storePath();
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(store, null, 2), "utf8");
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
  if (imageUrl && !/^https:\/\//.test(imageUrl)) {
    throw new Error("La imagen debe ser una URL https.");
  }

  const amenities = input.amenities
    .map((a) => a.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 8);

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
  };

  store.listings.push(listing);
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
