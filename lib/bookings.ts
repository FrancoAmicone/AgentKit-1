import { randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import {
  addDays,
  diffDays,
  isDateStr,
  isNightInRanges,
  nightsInRange,
  rangesOverlap,
  todayStr,
  type DateRange,
} from "./dates";

/** Longest stay the demo accepts (keeps totals sane on testnet). */
export const MAX_NIGHTS = 30;

export type Booking = {
  id: string;
  listingId: string;
  checkIn: string;
  /** Exclusive checkout day */
  checkOut: string;
  nights: number;
  amountUsdc: number;
  guestAgentAddress?: string;
  txHash?: string;
  usedHumanApproval?: boolean;
  createdAt: string;
  source: "onchain" | "seed";
};

type StoreFile = {
  bookings: Booking[];
};

function storePath(): string {
  // Demo-only: Vercel FS is read-only except /tmp (not durable).
  // See docs/11-demo-tradeoffs.md.
  if (process.env.VERCEL) {
    return join("/tmp", "stay-agent-bookings.json");
  }
  return join(process.cwd(), "data", "bookings.json");
}

async function readStore(): Promise<StoreFile> {
  try {
    const raw = await readFile(storePath(), "utf8");
    const parsed = JSON.parse(raw) as StoreFile;
    if (!Array.isArray(parsed?.bookings)) return { bookings: [] };
    return parsed;
  } catch {
    return { bookings: [] };
  }
}

async function writeStore(store: StoreFile): Promise<void> {
  const path = storePath();
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(store, null, 2), "utf8");
}

/**
 * Demo occupancy so public calendars show locked dates from day one.
 * Computed relative to "today" — never persisted.
 */
function demoSeedBookings(listingId: string): Booking[] {
  const offsets: Record<string, Array<[number, number]>> = {
    "bariloche-cabin": [
      [2, 5],
      [10, 13],
    ],
    "bariloche-lakehouse": [[4, 9]],
    "palermo-studio": [
      [1, 3],
      [7, 8],
    ],
    "pinamar-beach": [[3, 7]],
    "mendoza-vineyard": [[6, 10]],
  };
  const ranges = offsets[listingId];
  if (!ranges) return [];
  const today = todayStr();
  return ranges.map(([from, to], i) => {
    const checkIn = addDays(today, from);
    const checkOut = addDays(today, to);
    return {
      id: `seed-${listingId}-${i}`,
      listingId,
      checkIn,
      checkOut,
      nights: to - from,
      amountUsdc: 0,
      createdAt: new Date(0).toISOString(),
      source: "seed" as const,
    };
  });
}

export async function getBookingsForListing(listingId: string): Promise<Booking[]> {
  const store = await readStore();
  const stored = store.bookings.filter((b) => b.listingId === listingId);
  return [...demoSeedBookings(listingId), ...stored].sort((a, b) =>
    a.checkIn.localeCompare(b.checkIn),
  );
}

export async function getBookedRanges(listingId: string): Promise<DateRange[]> {
  const bookings = await getBookingsForListing(listingId);
  return bookings.map(({ checkIn, checkOut }) => ({ checkIn, checkOut }));
}

export type StayValidation =
  | { ok: true; checkIn: string; checkOut: string; nights: number }
  | { ok: false; error: string };

/** Validates a requested stay range (format, order, past dates, max length). */
export function validateStayRange(checkIn?: string, checkOut?: string): StayValidation {
  if (!isDateStr(checkIn) || !isDateStr(checkOut)) {
    return { ok: false, error: "Fechas inválidas: usá YYYY-MM-DD para check-in y check-out." };
  }
  const nights = diffDays(checkIn, checkOut);
  if (nights < 1) {
    return { ok: false, error: "El check-out debe ser posterior al check-in." };
  }
  if (nights > MAX_NIGHTS) {
    return { ok: false, error: `Máximo ${MAX_NIGHTS} noches por reserva.` };
  }
  if (checkIn < todayStr()) {
    return { ok: false, error: "El check-in no puede ser en el pasado." };
  }
  return { ok: true, checkIn, checkOut, nights };
}

export async function isRangeFree(listingId: string, range: DateRange): Promise<boolean> {
  const booked = await getBookedRanges(listingId);
  return !booked.some((b) => rangesOverlap(b, range));
}

/**
 * Whether every night of the stay falls inside the host's availability
 * windows. No windows defined = the property is always offered.
 */
export function stayWithinAvailability(
  windows: DateRange[] | undefined,
  range: DateRange,
): boolean {
  if (!windows || windows.length === 0) return true;
  return nightsInRange(range).every((night) => isNightInRanges(night, windows));
}

/** Exact total in USDC using integer micros (avoids float drift). */
export function stayTotalUsdc(pricePerNight: number, nights: number): number {
  const priceMicros = Math.round(pricePerNight * 1e6);
  return (priceMicros * nights) / 1e6;
}

/**
 * Creates a booking if the range is still free.
 * Returns null when the dates were taken in the meantime.
 */
export async function createBooking(input: {
  listingId: string;
  checkIn: string;
  checkOut: string;
  amountUsdc: number;
  guestAgentAddress?: string;
}): Promise<Booking | null> {
  const range = { checkIn: input.checkIn, checkOut: input.checkOut };
  const store = await readStore();
  const existing = [
    ...demoSeedBookings(input.listingId),
    ...store.bookings.filter((b) => b.listingId === input.listingId),
  ];
  if (existing.some((b) => rangesOverlap(b, range))) return null;

  const booking: Booking = {
    id: `bk_${randomBytes(8).toString("hex")}`,
    listingId: input.listingId,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    nights: diffDays(input.checkIn, input.checkOut),
    amountUsdc: input.amountUsdc,
    guestAgentAddress: input.guestAgentAddress,
    createdAt: new Date().toISOString(),
    source: "onchain",
  };
  store.bookings.push(booking);
  await writeStore(store);
  return booking;
}

/** Best-effort: attach the settlement tx once the payer learns it. */
export async function attachTxToBooking(
  bookingId: string,
  meta: { txHash?: string; usedHumanApproval?: boolean },
): Promise<void> {
  const store = await readStore();
  const booking = store.bookings.find((b) => b.id === bookingId);
  if (!booking) return;
  if (meta.txHash) booking.txHash = meta.txHash;
  if (meta.usedHumanApproval != null) booking.usedHumanApproval = meta.usedHumanApproval;
  await writeStore(store);
}
