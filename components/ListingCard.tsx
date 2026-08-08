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
  index?: number;
};

export function ListingCard({
  listing,
  autoLimitUsdc,
  canPurchase,
  buying,
  onBuy,
  onNeedSetup,
  index = 0,
}: Props) {
  const overLimit =
    autoLimitUsdc != null && listing.pricePerNight > autoLimitUsdc;

  return (
    <article
      className="stay-rise group overflow-hidden border border-[var(--line)] bg-white/55 transition duration-300 hover:border-[var(--pine)]/30 hover:bg-white/80"
      style={{ animationDelay: `${Math.min(index, 6) * 0.05}s` }}
    >
      <div className="relative overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={listing.imageUrl}
          alt={listing.title}
          className="h-48 w-full object-cover transition duration-500 group-hover:scale-[1.03]"
        />
        <p className="absolute bottom-3 right-3 bg-[var(--ink)]/85 px-2.5 py-1 text-sm font-semibold text-[var(--paper)] backdrop-blur-sm">
          ${listing.pricePerNight}
          <span className="font-normal opacity-70">/noche</span>
        </p>
      </div>
      <div className="p-4 sm:p-5">
        <h3
          className="text-xl leading-snug text-[var(--ink)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {listing.title}
        </h3>
        <p className="mt-1 text-sm text-[var(--muted)]">{listing.location}</p>
        <p className="mt-2 text-xs tracking-wide text-[var(--muted)]">
          ★ {listing.rating} · {listing.amenities.slice(0, 3).join(" · ")}
        </p>
        {listing.matchReason && (
          <p className="mt-3 text-sm text-[var(--pine-deep)]">
            {listing.matchReason}
          </p>
        )}
        {overLimit && (
          <p className="mt-2 text-xs font-medium text-[var(--clay)]">
            Sobre tu tope (${autoLimitUsdc}). Pedirá aprobación en World.
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
          className="mt-5 w-full bg-[var(--ink)] px-4 py-3 text-sm font-semibold text-[var(--paper)] transition hover:bg-[var(--pine-deep)] disabled:opacity-60"
        >
          {buying
            ? "Pagando con el agente…"
            : !canPurchase
              ? "Configurar agente para pagar"
              : overLimit
                ? "Reservar (pide aprobación)"
                : "Reservar y pagar"}
        </button>
      </div>
    </article>
  );
}
