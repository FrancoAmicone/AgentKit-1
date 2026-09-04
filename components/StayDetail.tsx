"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ListingImage } from "@/components/ListingImage";
import { mapsSearchUrl } from "@/lib/listing-images";
import {
  AvailabilityCalendar,
  type StaySelection,
} from "@/components/AvailabilityCalendar";
import { PurchaseApprovalModal } from "@/components/PurchaseApprovalModal";
import {
  ReservationReceipt,
  type ReservationReceiptData,
} from "@/components/ReservationReceipt";
import { useAgent } from "@/components/AgentSessionProvider";
import { diffDays, formatDateEs, type DateRange } from "@/lib/dates";
import type { Listing } from "@/lib/listings-data";

type PurchaseResponse = ReservationReceiptData & {
  ok: boolean;
  error?: string;
  hint?: string;
  registerHint?: string;
  code?: string;
};

type PayoutInfo = {
  address: string;
  source: "listing" | "host" | "marketplace";
  isEvm: boolean;
};

type Props = {
  listingId: string;
  listing: Listing | null;
  initialBookedRanges: DateRange[];
};

function stayTotal(pricePerNight: number, nights: number): number {
  return (Math.round(pricePerNight * 1e6) * nights) / 1e6;
}

function payoutLabel(source: PayoutInfo["source"]): string {
  if (source === "listing") return "wallet de esta propiedad";
  if (source === "host") return "wallet del anfitrión";
  return "wallet del marketplace (demo)";
}

export function StayDetail({
  listingId,
  listing: initialListing,
  initialBookedRanges,
}: Props) {
  const agent = useAgent();
  const [listing, setListing] = useState<Listing | null>(initialListing);
  const [payout, setPayout] = useState<PayoutInfo | null>(null);
  const [loadState, setLoadState] = useState<"ready" | "loading" | "missing">(
    initialListing ? "ready" : "loading",
  );
  const [bookedRanges, setBookedRanges] = useState<DateRange[]>(initialBookedRanges);
  const [selection, setSelection] = useState<StaySelection>({});
  const [buying, setBuying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [purchase, setPurchase] = useState<PurchaseResponse | null>(null);
  const [approvalStay, setApprovalStay] = useState<{
    checkIn: string;
    checkOut: string;
    nights: number;
    totalUsdc: number;
  } | null>(null);

  const loadListing = useCallback(async () => {
    try {
      const res = await fetch(`/api/listings/${listingId}`);
      if (res.status === 404) {
        setLoadState("missing");
        setListing(null);
        return;
      }
      const data = (await res.json()) as {
        listing?: Listing;
        bookedRanges?: DateRange[];
        payout?: PayoutInfo;
      };
      if (!data.listing) {
        setLoadState("missing");
        return;
      }
      setListing(data.listing);
      if (Array.isArray(data.bookedRanges)) setBookedRanges(data.bookedRanges);
      if (data.payout) setPayout(data.payout);
      setLoadState("ready");
    } catch {
      setLoadState(initialListing ? "ready" : "missing");
    }
  }, [listingId, initialListing]);

  useEffect(() => {
    void (async () => {
      await loadListing();
    })();
  }, [loadListing]);

  const nights =
    selection.checkIn && selection.checkOut
      ? diffDays(selection.checkIn, selection.checkOut)
      : 0;
  const totalUsdc =
    listing && nights > 0 ? stayTotal(listing.pricePerNight, nights) : 0;
  const autoLimit = agent.autoLimitUsdc;
  const overLimit = autoLimit != null && totalUsdc > autoLimit && nights > 0;

  const refreshAvailability = useCallback(async () => {
    try {
      const res = await fetch(`/api/listings/${listingId}`);
      const data = (await res.json()) as {
        bookedRanges?: DateRange[];
        payout?: PayoutInfo;
      };
      if (Array.isArray(data.bookedRanges)) setBookedRanges(data.bookedRanges);
      if (data.payout) setPayout(data.payout);
    } catch {
      // keep the ranges we have
    }
  }, [listingId]);

  const onPurchaseSuccess = useCallback(
    (result: PurchaseResponse) => {
      setPurchase(result);
      setApprovalStay(null);
      setSelection({});
      setError(null);
      agent.refreshAll();
      void refreshAvailability();
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [agent, refreshAvailability],
  );

  async function onReserve() {
    if (!listing) return;
    if (!selection.checkIn || !selection.checkOut) {
      setError("Elegí check-in y check-out en el calendario.");
      return;
    }
    if (!agent.canPurchase) {
      agent.setSetupOpen(true);
      return;
    }

    const stay = {
      checkIn: selection.checkIn,
      checkOut: selection.checkOut,
      nights,
      totalUsdc,
    };

    if (overLimit) {
      setApprovalStay(stay);
      return;
    }

    setBuying(true);
    setError(null);
    try {
      const res = await fetch("/api/agent/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: listing.id,
          checkIn: stay.checkIn,
          checkOut: stay.checkOut,
        }),
      });
      const data = (await res.json()) as PurchaseResponse;
      if (!res.ok || !data.ok) {
        if (data.code === "AGENT_NOT_HUMAN_BACKED" || data.code === "AGENT_NOT_CREATED") {
          agent.setSetupOpen(true);
        }
        if (data.code === "NEEDS_HUMAN_APPROVAL") {
          setApprovalStay(stay);
          return;
        }
        if (data.code === "DATES_TAKEN") {
          void refreshAvailability();
        }
        const parts = [data.error, data.hint, data.registerHint].filter(Boolean);
        throw new Error(parts.join(" — ") || "No se pudo completar el pago");
      }
      onPurchaseSuccess(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de compra");
      agent.refreshAll();
    } finally {
      setBuying(false);
    }
  }

  const nightsBookedTotal = useMemo(
    () => bookedRanges.reduce((sum, r) => sum + diffDays(r.checkIn, r.checkOut), 0),
    [bookedRanges],
  );

  if (loadState === "loading") {
    return (
      <main className="mx-auto min-h-screen max-w-6xl px-5 pb-10 pt-6 sm:px-8">
        <Link
          href="/"
          className="text-sm font-semibold text-[var(--pine)] underline-offset-2 hover:underline"
        >
          ← Volver al catálogo
        </Link>
        <p className="mt-10 text-sm text-[var(--muted)]">Cargando alojamiento…</p>
      </main>
    );
  }

  if (!listing || loadState === "missing") {
    return (
      <main className="mx-auto min-h-screen max-w-6xl px-5 pb-10 pt-6 sm:px-8">
        <Link
          href="/"
          className="text-sm font-semibold text-[var(--pine)] underline-offset-2 hover:underline"
        >
          ← Volver al catálogo
        </Link>
        <h1
          className="mt-8 text-3xl text-[var(--ink)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          No encontramos este alojamiento
        </h1>
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-[var(--muted)]">
          Puede que todavía se esté propagando después de publicarlo, o que el
          enlace sea viejo. Si acabás de publicarlo, esperá un segundo y
          reintentá.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              setLoadState("loading");
              void loadListing();
            }}
            className="bg-[var(--pine)] px-4 py-2 text-sm font-semibold text-white"
          >
            Reintentar
          </button>
          <Link
            href="/host"
            className="border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--ink)]"
          >
            Ir al modo anfitrión
          </Link>
        </div>
      </main>
    );
  }

  const payAddress = payout?.address || listing.ownerWalletAddress;
  const paySource = payout?.source || (listing.source === "host" ? "host" : "marketplace");

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-5 pb-10 pt-6 sm:px-8">
      <Link
        href="/"
        className="text-sm font-semibold text-[var(--pine)] underline-offset-2 hover:underline"
      >
        ← Volver al catálogo
      </Link>

      {purchase?.ok && (
        <div className="mt-4">
          <ReservationReceipt purchase={purchase} />
        </div>
      )}

      <div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px]">
        <section className="stay-rise">
          <div className="relative overflow-hidden border border-[var(--line)]">
            <ListingImage
              src={listing.imageUrl}
              alt={listing.title}
              className="h-72 w-full object-cover sm:h-96"
            />
            {listing.source === "host" && (
              <p className="absolute left-4 top-4 bg-[var(--clay)]/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
                Publicado por anfitrión
              </p>
            )}
          </div>

          <h1
            className="mt-6 text-[clamp(1.9rem,4.5vw,2.9rem)] leading-tight text-[var(--ink)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {listing.title}
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {listing.location} · ★ {listing.rating} · hasta {listing.maxGuests}{" "}
            huéspedes
            {" · "}
            <a
              href={mapsSearchUrl(listing.location)}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-[var(--pine)] underline underline-offset-2"
            >
              Ver en Maps
            </a>
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {listing.amenities.map((a) => (
              <span
                key={a}
                className="border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1 text-xs text-[var(--muted)]"
              >
                {a}
              </span>
            ))}
          </div>

          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-[var(--ink)]/85">
            {listing.description}
          </p>

          <div className="mt-6 border border-[var(--line)] bg-[var(--surface)] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
              Cobro automático (x402 → {payoutLabel(paySource)})
            </p>
            <p className="mt-1.5 break-all font-mono text-xs text-[var(--ink)]">
              {payAddress}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">
              Cuando el agente del huésped paga la reserva, el USDC se liquida
              directo a esta wallet en Base Sepolia — sin custodia intermedia.
              {paySource === "marketplace"
                ? " El anfitrión todavía no registró wallet propia."
                : " Este es el destino del pago automático al anfitrión."}
            </p>
          </div>
        </section>

        <aside className="stay-rise-delay lg:sticky lg:top-20 lg:self-start">
          <div className="border border-[var(--line)] bg-[var(--surface)] p-5">
            <div className="flex items-baseline justify-between">
              <p className="text-2xl font-semibold text-[var(--ink)]">
                ${listing.pricePerNight}
                <span className="text-sm font-normal text-[var(--muted)]">
                  {" "}
                  USDC/noche
                </span>
              </p>
              <p className="text-xs text-[var(--muted)]">
                {nightsBookedTotal} noche{nightsBookedTotal === 1 ? "" : "s"}{" "}
                ya reservada{nightsBookedTotal === 1 ? "" : "s"}
              </p>
            </div>

            {listing.availabilityWindows &&
              listing.availabilityWindows.length > 0 && (
                <p className="mt-3 text-xs leading-relaxed text-[var(--muted)]">
                  El anfitrión lo ofrece:{" "}
                  {listing.availabilityWindows
                    .map(
                      (w) =>
                        `${formatDateEs(w.checkIn)} → ${formatDateEs(w.checkOut)}`,
                    )
                    .join(" · ")}
                </p>
              )}

            <div className="mt-4">
              <AvailabilityCalendar
                bookedRanges={bookedRanges}
                availabilityWindows={listing.availabilityWindows}
                value={selection}
                onChange={(v) => {
                  setSelection(v);
                  setError(null);
                }}
                months={1}
              />
            </div>

            <div className="mt-4 border-t border-[var(--line)] pt-4 text-sm">
              {selection.checkIn ? (
                <>
                  <p className="text-[var(--ink)]">
                    <strong>{formatDateEs(selection.checkIn)}</strong>
                    {selection.checkOut ? (
                      <>
                        {" → "}
                        <strong>{formatDateEs(selection.checkOut)}</strong> ·{" "}
                        {nights} noche{nights === 1 ? "" : "s"}
                      </>
                    ) : (
                      <span className="text-[var(--muted)]">
                        {" "}
                        — ahora elegí el check-out
                      </span>
                    )}
                  </p>
                  {nights > 0 && (
                    <p className="mt-1.5 text-lg font-semibold text-[var(--ink)]">
                      Total: ${totalUsdc} USDC
                    </p>
                  )}
                </>
              ) : (
                <p className="text-[var(--muted)]">
                  Elegí una fecha de check-in en el calendario.
                </p>
              )}

              {overLimit && (
                <p className="mt-2 text-xs font-medium text-[var(--clay)]">
                  Supera tu tope automático (${autoLimit}). El agente pedirá tu
                  aprobación en World App.
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => void onReserve()}
              disabled={buying || nights === 0}
              className="mt-4 w-full bg-[var(--ink)] px-4 py-3 text-sm font-semibold text-[var(--paper)] transition hover:bg-[var(--pine-deep)] disabled:opacity-50"
            >
              {buying
                ? "Pagando con el agente…"
                : !agent.canPurchase
                  ? "Configurar agente para pagar"
                  : overLimit
                    ? "Reservar (pide aprobación)"
                    : "Reservar y pagar con mi agente"}
            </button>

            {!agent.canPurchase && (
              <p className="mt-3 text-xs leading-relaxed text-[var(--muted)]">
                Ver la disponibilidad es libre. Para pagar,{" "}
                <button
                  type="button"
                  onClick={() => agent.setSetupOpen(true)}
                  className="font-semibold text-[var(--pine)] underline underline-offset-2"
                >
                  configurá tu agente
                </button>{" "}
                (crear · fondear · World · tope).
              </p>
            )}

            {error && (
              <p className="mt-3 border border-[var(--danger)]/25 bg-[var(--danger)]/8 px-3 py-2 text-xs text-[var(--danger)]">
                {error}
              </p>
            )}
          </div>
        </aside>
      </div>

      {approvalStay && (
        <PurchaseApprovalModal
          key={`${listing.id}-${approvalStay.checkIn}-${approvalStay.checkOut}`}
          open
          listing={{
            id: listing.id,
            title: listing.title,
            location: listing.location,
            amountUsdc: approvalStay.totalUsdc,
            checkIn: approvalStay.checkIn,
            checkOut: approvalStay.checkOut,
            nights: approvalStay.nights,
          }}
          autoPayLimitUsdc={autoLimit}
          onClose={() => setApprovalStay(null)}
          onApprovedPurchase={(result) =>
            onPurchaseSuccess(result as PurchaseResponse)
          }
        />
      )}
    </main>
  );
}
