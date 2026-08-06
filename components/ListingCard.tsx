"use client";

export type ListingCardData = {
  id: string;
  title: string;
  location: string;
  pricePerNight: number;
  amenities: string[];
  rating: number;
  imageUrl: string;
  matchReason?: string;
};

type Props = {
  listing: ListingCardData;
  autoLimitUsdc?: number;
  canPurchase: boolean;
  buying: boolean;
  onBuy: (listing: ListingCardData) => void;
  onNeedSetup: () => void;
};

export function ListingCard({
  listing,
  autoLimitUsdc,
  canPurchase,
  buying,
  onBuy,
  onNeedSetup,
}: Props) {
  const overLimit =
    autoLimitUsdc != null && listing.pricePerNight > autoLimitUsdc;

  return (
    <article className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white/80 shadow-[0_12px_40px_rgba(26,36,33,0.05)]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={listing.imageUrl}
        alt={listing.title}
        className="h-44 w-full object-cover"
      />
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <h3
            className="text-xl leading-snug"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {listing.title}
          </h3>
          <p className="shrink-0 text-sm font-semibold text-[var(--clay)]">
            ${listing.pricePerNight}
            <span className="font-normal text-[var(--muted)]">/noche</span>
          </p>
        </div>
        <p className="mt-1 text-sm text-[var(--muted)]">{listing.location}</p>
        <p className="mt-2 text-xs text-[var(--muted)]">
          ★ {listing.rating} · {listing.amenities.join(" · ")}
        </p>
        {listing.matchReason && (
          <p className="mt-3 text-sm text-[var(--pine-deep)]">
            {listing.matchReason}
          </p>
        )}
        {overLimit && (
          <p className="mt-2 text-xs font-medium text-[var(--clay)]">
            Supera tu tope (${autoLimitUsdc} USDC). Al tocar pagar te preguntamos
            si lo aprobás.
          </p>
        )}
        <button
          type="button"
          onClick={() => {
            if (!canPurchase) {
              onNeedSetup();
              return;
            }
            onBuy(listing);
          }}
          disabled={buying}
          className="mt-4 w-full rounded-xl bg-[var(--ink)] px-4 py-2.5 text-sm font-semibold text-[var(--paper)] transition hover:bg-[var(--pine-deep)] disabled:opacity-60"
        >
          {buying
            ? "Pagando con el agente…"
            : !canPurchase
              ? "Verificar agente para pagar"
              : overLimit
                ? "Reservar (pide aprobación)"
                : "Reservar y pagar"}
        </button>
      </div>
    </article>
  );
}
