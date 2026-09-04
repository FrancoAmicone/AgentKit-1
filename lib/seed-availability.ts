import { DEMO_BOOKING_OFFSETS } from "@/lib/bookings";
import { addDays, todayStr, type DateRange } from "@/lib/dates";
import { normalizeAvailabilityWindows } from "@/lib/host-listings";

function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f3;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/** Merge overlapping or adjacent half-open ranges so the public list stays clean. */
function mergeWindows(windows: DateRange[]): DateRange[] {
  const sorted = [...windows].sort((a, b) => a.checkIn.localeCompare(b.checkIn));
  const out: DateRange[] = [];
  for (const w of sorted) {
    const last = out[out.length - 1];
    if (last && w.checkIn <= last.checkOut) {
      if (w.checkOut > last.checkOut) last.checkOut = w.checkOut;
    } else {
      out.push({ checkIn: w.checkIn, checkOut: w.checkOut });
    }
  }
  return out;
}

/**
 * Ventanas de oferta para el catálogo semilla. El PRNG es determinístico por
 * `listingId` (mismo día → mismas ventanas en SSR y cliente). Se regeneran
 * relativas a `from` para que el calendario no quede obsoleto.
 *
 * Las reservas de demo (`DEMO_BOOKING_OFFSETS`) se fusionan para que las noches
 * ya ocupadas sigan cayendo dentro de una ventana ofrecida.
 */
export function seedAvailabilityWindows(
  listingId: string,
  from: string = todayStr(),
): DateRange[] {
  const rng = mulberry32(hashString(listingId));
  const windows: DateRange[] = [];
  let cursor = 0;
  const count = 2 + Math.floor(rng() * 3);

  for (let i = 0; i < count; i += 1) {
    cursor += Math.floor(rng() * 10);
    const nights = 5 + Math.floor(rng() * 18);
    const checkIn = addDays(from, cursor);
    const checkOut = addDays(checkIn, nights);
    windows.push({ checkIn, checkOut });
    cursor += nights + 3 + Math.floor(rng() * 12);
  }

  for (const [ci, co] of DEMO_BOOKING_OFFSETS[listingId] ?? []) {
    windows.push({
      checkIn: addDays(from, ci),
      checkOut: addDays(from, co),
    });
  }

  return normalizeAvailabilityWindows(mergeWindows(windows)) ?? [];
}
