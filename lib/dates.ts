/**
 * Date helpers shared by server (bookings) and client (calendar).
 * All dates are plain "YYYY-MM-DD" strings interpreted as calendar days
 * (no timezone math — comparisons are lexicographic-safe).
 */

export type DateRange = {
  /** First night (inclusive), YYYY-MM-DD */
  checkIn: string;
  /** Checkout day (exclusive), YYYY-MM-DD */
  checkOut: string;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isDateStr(value: unknown): value is string {
  if (typeof value !== "string" || !DATE_RE.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  if (m < 1 || m > 12 || d < 1) return false;
  return d <= daysInMonth(y, m);
}

export function daysInMonth(year: number, month1: number): number {
  return new Date(Date.UTC(year, month1, 0)).getUTCDate();
}

export function todayStr(): string {
  const now = new Date();
  return toDateStr(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

export function toDateStr(year: number, month1: number, day: number): string {
  const mm = String(month1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const ms = Date.UTC(y, m - 1, d) + days * 86_400_000;
  const next = new Date(ms);
  return toDateStr(next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate());
}

/** Whole days from a to b (b - a). */
export function diffDays(a: string, b: string): number {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86_400_000);
}

/** Half-open ranges [checkIn, checkOut) overlap. */
export function rangesOverlap(a: DateRange, b: DateRange): boolean {
  return a.checkIn < b.checkOut && b.checkIn < a.checkOut;
}

/** Every night in the range (checkOut excluded). */
export function nightsInRange(range: DateRange): string[] {
  const nights: string[] = [];
  let cursor = range.checkIn;
  while (cursor < range.checkOut) {
    nights.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return nights;
}

export function formatDateEs(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const months = [
    "ene", "feb", "mar", "abr", "may", "jun",
    "jul", "ago", "sep", "oct", "nov", "dic",
  ];
  return `${d} ${months[m - 1]} ${y}`;
}
