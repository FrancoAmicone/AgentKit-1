"use client";

import { useMemo, useState } from "react";
import {
  daysInMonth,
  isNightInRanges,
  nightsInRange,
  toDateStr,
  todayStr,
  type DateRange,
} from "@/lib/dates";

export type StaySelection = {
  checkIn?: string;
  checkOut?: string;
};

type Props = {
  bookedRanges: DateRange[];
  /**
   * Host-defined windows when the property is offered. Absent/empty =
   * always offered; otherwise nights outside every window render closed.
   */
  availabilityWindows?: DateRange[];
  value?: StaySelection;
  onChange?: (value: StaySelection) => void;
  readOnly?: boolean;
  /** How many months to render side by side (1 on small screens via CSS). */
  months?: number;
  compact?: boolean;
};

const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];
const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

/**
 * Public availability calendar: booked nights show locked; free future
 * nights are selectable as a check-in → check-out range (checkout exclusive,
 * so a stay can end the same day another one starts).
 */
export function AvailabilityCalendar({
  bookedRanges,
  availabilityWindows,
  value,
  onChange,
  readOnly = false,
  months = 2,
  compact = false,
}: Props) {
  const [offset, setOffset] = useState(0);
  const today = useMemo(() => todayStr(), []);

  const bookedNights = useMemo(() => {
    const set = new Set<string>();
    for (const range of bookedRanges) {
      for (const night of nightsInRange(range)) set.add(night);
    }
    return set;
  }, [bookedRanges]);

  const hasWindows = Boolean(availabilityWindows && availabilityWindows.length > 0);

  const selection = value ?? {};

  function isNightBooked(day: string): boolean {
    return bookedNights.has(day);
  }

  function isNightClosed(day: string): boolean {
    if (!hasWindows) return false;
    return !isNightInRanges(day, availabilityWindows!);
  }

  function handleDayClick(day: string) {
    if (readOnly || !onChange) return;
    if (day < today || isNightBooked(day) || isNightClosed(day)) return;

    const { checkIn, checkOut } = selection;
    if (!checkIn || (checkIn && checkOut)) {
      onChange({ checkIn: day, checkOut: undefined });
      return;
    }
    if (day <= checkIn) {
      onChange({ checkIn: day, checkOut: undefined });
      return;
    }
    // Every night between checkIn and day must be free and offered.
    const wanted = nightsInRange({ checkIn, checkOut: day });
    if (wanted.some((n) => bookedNights.has(n) || isNightClosed(n))) {
      onChange({ checkIn: day, checkOut: undefined });
      return;
    }
    onChange({ checkIn, checkOut: day });
  }

  const now = new Date();
  const baseYear = now.getFullYear();
  const baseMonth = now.getMonth() + 1 + offset;

  const monthViews = Array.from({ length: months }, (_, i) => {
    const total = baseMonth + i - 1;
    const year = baseYear + Math.floor(total / 12);
    const month1 = (total % 12) + 1;
    return { year, month1 };
  });

  const cellSize = compact
    ? "h-8 w-8 text-[11px]"
    : "h-9 w-9 text-xs sm:h-10 sm:w-10 sm:text-sm";

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setOffset((o) => Math.max(0, o - 1))}
          disabled={offset === 0}
          aria-label="Mes anterior"
          className="border border-[var(--line)] bg-white/60 px-2.5 py-1 text-sm text-[var(--ink)] transition hover:bg-white disabled:opacity-40"
        >
          ←
        </button>
        <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
          Disponibilidad
        </p>
        <button
          type="button"
          onClick={() => setOffset((o) => Math.min(11, o + 1))}
          aria-label="Mes siguiente"
          className="border border-[var(--line)] bg-white/60 px-2.5 py-1 text-sm text-[var(--ink)] transition hover:bg-white disabled:opacity-40"
        >
          →
        </button>
      </div>

      <div
        className={`grid gap-5 ${months > 1 ? "sm:grid-cols-2" : ""}`}
      >
        {monthViews.map(({ year, month1 }) => {
          const numDays = daysInMonth(year, month1);
          // Monday-first offset of day 1
          const firstWeekday =
            (new Date(Date.UTC(year, month1 - 1, 1)).getUTCDay() + 6) % 7;

          return (
            <div key={`${year}-${month1}`}>
              <p className="mb-2 text-center text-sm font-semibold text-[var(--ink)]">
                {MONTHS_ES[month1 - 1]} {year}
              </p>
              <div className="grid grid-cols-7 justify-items-center gap-y-1">
                {WEEKDAYS.map((w, i) => (
                  <span
                    key={`${w}-${i}`}
                    className="text-[10px] font-semibold uppercase text-[var(--muted)]"
                  >
                    {w}
                  </span>
                ))}
                {Array.from({ length: firstWeekday }, (_, i) => (
                  <span key={`pad-${i}`} />
                ))}
                {Array.from({ length: numDays }, (_, i) => {
                  const day = toDateStr(year, month1, i + 1);
                  const past = day < today;
                  const booked = isNightBooked(day);
                  const closed = !booked && isNightClosed(day);
                  const isCheckIn = selection.checkIn === day;
                  const isCheckOut = selection.checkOut === day;
                  const inRange =
                    selection.checkIn &&
                    selection.checkOut &&
                    day > selection.checkIn &&
                    day < selection.checkOut;
                  const selectable = !readOnly && !past && !booked && !closed;

                  let cls =
                    "flex items-center justify-center transition select-none ";
                  if (past) {
                    cls += "text-[var(--muted)]/40";
                  } else if (booked) {
                    cls +=
                      "bg-[var(--danger)]/10 text-[var(--danger)]/70 line-through";
                  } else if (closed) {
                    cls += "bg-black/[0.05] text-[var(--muted)]/50";
                  } else if (isCheckIn || isCheckOut) {
                    cls += "bg-[var(--pine)] font-semibold text-white";
                  } else if (inRange) {
                    cls += "bg-[var(--pine)]/20 text-[var(--pine-deep)]";
                  } else if (selectable) {
                    cls +=
                      "cursor-pointer text-[var(--ink)] hover:bg-[var(--pine)]/15";
                  } else {
                    cls += "text-[var(--ink)]";
                  }

                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleDayClick(day)}
                      disabled={!selectable}
                      aria-label={
                        booked
                          ? `${day} — reservado`
                          : closed
                            ? `${day} — no ofrecido`
                            : `${day} — disponible`
                      }
                      className={`${cellSize} ${cls}`}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[var(--muted)]">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 bg-[var(--danger)]/15" />
          Reservado
        </span>
        {hasWindows && (
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 bg-black/[0.07]" />
            No ofrecido
          </span>
        )}
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 bg-[var(--pine)]/20" />
          Tu selección
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 border border-[var(--line)] bg-white/70" />
          Libre
        </span>
      </div>
    </div>
  );
}
