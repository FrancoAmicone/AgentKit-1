"use client";

/**
 * Compact progress strip for the guest agent journey.
 * Used on home + setup so the user always knows what's next.
 */
export type GuestStepId = "create" | "fund" | "world" | "tope" | "ready";

const STEPS: { id: GuestStepId; label: string }[] = [
  { id: "create", label: "Crear" },
  { id: "fund", label: "Fondear" },
  { id: "world", label: "World" },
  { id: "tope", label: "Tope" },
  { id: "ready", label: "Listo" },
];

const ORDER: GuestStepId[] = ["create", "fund", "world", "tope", "ready"];

export function guestStepFromFlags(flags: {
  hasAgent: boolean;
  funded: boolean;
  registered: boolean;
  topeSaved: boolean;
}): GuestStepId {
  if (!flags.hasAgent) return "create";
  if (!flags.funded) return "fund";
  if (!flags.registered) return "world";
  if (!flags.topeSaved) return "tope";
  return "ready";
}

export function GuestProgress({
  current,
  compact = false,
}: {
  current: GuestStepId;
  compact?: boolean;
}) {
  const currentIdx = ORDER.indexOf(current);

  return (
    <ol
      className={`grid grid-cols-5 items-stretch ${compact ? "gap-1" : "gap-1.5"}`}
      aria-label="Progreso del agente"
    >
      {STEPS.map((step, idx) => {
        const done = idx < currentIdx;
        const active = idx === currentIdx;
        return (
          <li
            key={step.id}
            className="min-w-0"
            aria-current={active ? "step" : undefined}
          >
            <div
              className={`flex h-full min-h-11 flex-col items-center justify-center gap-0.5 border px-0.5 py-1.5 text-center sm:min-h-12 ${
                active
                  ? "border-[var(--pine)] bg-[var(--pine)] text-[var(--paper)]"
                  : done
                    ? "border-[var(--pine)]/30 bg-[var(--pine)]/10 text-[var(--pine)]"
                    : "border-[var(--line)] bg-[var(--surface)] text-[var(--muted)]"
              }`}
            >
              <span
                className="text-[10px] leading-none tabular-nums"
                aria-hidden="true"
              >
                {done ? "✓" : idx + 1}
              </span>
              <span
                className={`max-w-full truncate leading-none ${
                  compact
                    ? "text-[9px] font-semibold"
                    : "text-[10px] font-semibold sm:text-[11px]"
                }`}
              >
                {step.label}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
