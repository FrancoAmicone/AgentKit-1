import { addDays, isDateStr, todayStr, toDateStr } from "./dates";

const MONTHS: Record<string, number> = {
  enero: 1,
  ene: 1,
  febrero: 2,
  feb: 2,
  marzo: 3,
  mar: 3,
  abril: 4,
  abr: 4,
  mayo: 5,
  may: 5,
  junio: 6,
  jun: 6,
  julio: 7,
  jul: 7,
  agosto: 8,
  ago: 8,
  septiembre: 9,
  setiembre: 9,
  sep: 9,
  set: 9,
  octubre: 10,
  oct: 10,
  noviembre: 11,
  nov: 11,
  diciembre: 12,
  dic: 12,
};

function normalize(query: string): string {
  return query
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function ymd(year: number, month1: number, day: number): string | null {
  const iso = toDateStr(year, month1, day);
  return isDateStr(iso) ? iso : null;
}

/** If the candidate night already passed, roll to next year. */
function futureOrNextYear(iso: string, from: string): string {
  if (iso >= from) return iso;
  const [y, m, d] = iso.split("-").map(Number);
  return ymd(y + 1, m, d) ?? iso;
}

function resolveDay(
  day: number,
  month1: number | undefined,
  year: number | undefined,
  from: string,
): string | null {
  const [fy, fm] = from.split("-").map(Number);
  const month = month1 ?? fm;
  const baseYear = year ?? fy;
  const iso = ymd(baseYear, month, day);
  if (!iso) return null;
  if (year) return iso;
  if (month1) return futureOrNextYear(iso, from);
  if (iso >= from) return iso;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? baseYear + 1 : baseYear;
  return ymd(nextYear, nextMonth, day);
}

function nextFriday(from: string): string {
  const [y, m, d] = from.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const weekday = date.getUTCDay(); // 0 Sun … 5 Fri
  const add = weekday === 5 ? 0 : (5 - weekday + 7) % 7;
  return addDays(from, add);
}

/**
 * Pull a stay range out of a Spanish search string.
 * Supports ISO dates, DD/MM, "del 10 al 15", "10 al 13 de noviembre", "el finde".
 */
export function parseStayDates(
  query: string,
  from: string = todayStr(),
): { checkIn: string; checkOut: string } | null {
  const lower = normalize(query);

  if (/\b(este\s+)?(finde|fin\s+de\s+semana)\b/.test(lower)) {
    const checkIn = nextFriday(from);
    return { checkIn, checkOut: addDays(checkIn, 2) };
  }

  const iso = lower.match(
    /(\d{4}-\d{2}-\d{2})\D{1,24}(\d{4}-\d{2}-\d{2})/,
  );
  if (iso && isDateStr(iso[1]) && isDateStr(iso[2]) && iso[1] < iso[2]) {
    return { checkIn: iso[1], checkOut: iso[2] };
  }

  const slash = lower.match(
    /(\d{1,2})[/-](\d{1,2})(?:[/-](\d{4}))?\D{1,16}(\d{1,2})[/-](\d{1,2})(?:[/-](\d{4}))?/,
  );
  if (slash) {
    const checkIn = resolveDay(
      Number(slash[1]),
      Number(slash[2]),
      slash[3] ? Number(slash[3]) : undefined,
      from,
    );
    const checkOut = resolveDay(
      Number(slash[4]),
      Number(slash[5]),
      slash[6] ? Number(slash[6]) : undefined,
      from,
    );
    if (checkIn && checkOut && checkIn < checkOut) {
      return { checkIn, checkOut };
    }
  }

  const verbal = lower.match(
    /(?:del?|entre(?:\s+el)?)\s+(\d{1,2})(?:\s+de\s+([a-z]+))?\s+(?:al?|y(?:\s+el)?)\s+(\d{1,2})(?:\s+de\s+([a-z]+))?/,
  );
  if (verbal) {
    const monthOut = verbal[4] ? MONTHS[verbal[4]] : undefined;
    const monthIn = verbal[2] ? MONTHS[verbal[2]] : monthOut;
    const checkIn = resolveDay(Number(verbal[1]), monthIn, undefined, from);
    const checkOut = resolveDay(Number(verbal[3]), monthOut ?? monthIn, undefined, from);
    if (checkIn && checkOut && checkIn < checkOut) {
      return { checkIn, checkOut };
    }
  }

  const compact = lower.match(
    /(\d{1,2})\s+al?\s+(\d{1,2})(?:\s+de\s+([a-z]+))?/,
  );
  if (compact) {
    const month = compact[3] ? MONTHS[compact[3]] : undefined;
    const checkIn = resolveDay(Number(compact[1]), month, undefined, from);
    const checkOut = resolveDay(Number(compact[2]), month, undefined, from);
    if (checkIn && checkOut && checkIn < checkOut) {
      return { checkIn, checkOut };
    }
  }

  return null;
}
