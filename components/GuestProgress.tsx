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

export function GuestProgress({ current }: { current: GuestStepId }) {
  const currentIdx = ORDER.indexOf(current);

  return (
    <ol
      className="mb-5 grid grid-cols-5 gap-1.5"
      aria-label="Progreso del agente"
    >
      {STEPS.map((step, idx) => {
        const done = idx < currentIdx;
        const active = idx === currentIdx;
        return (
          <li key={step.id}>
            <div
              className={`border px-1.5 py-2 text-center text-[10px] font-semibold tracking-wide sm:text-[11px] ${
                active
                  ? "border-[var(--pine)] bg-[var(--pine)] text-[var(--paper)]"
                  : done
                    ? "border-[var(--pine)]/30 bg-[var(--pine)]/10 text-[var(--pine)]"
                    : "border-[var(--line)] bg-[var(--surface)] text-[var(--muted)]"
              }`}
            >
              {done ? "✓ " : `${idx + 1}. `}
              {step.label}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
