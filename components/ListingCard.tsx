"use client";

import Link from "next/link";

export type ListingCardData = {
  id: string;
  title: string;
  location: string;
  pricePerNight: number;
  amenities: string[];
  rating: number;
  imageUrl: string;
  source?: "seed" | "host";
  matchReason?: string;
};

type Props = {
  listing: ListingCardData;
  index?: number;
};

/**
 * Catalog card: leads to the public listing page (/stays/[id]) where the
 * availability calendar and the agent-powered booking live.
 */
export function ListingCard({ listing, index = 0 }: Props) {
  return (
    <Link
      href={`/stays/${listing.id}`}
      className="stay-rise group block overflow-hidden border border-[var(--line)] bg-white/55 transition duration-300 hover:border-[var(--pine)]/30 hover:bg-white/80"
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
        {listing.source === "host" && (
          <p className="absolute left-3 top-3 bg-[var(--clay)]/90 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">
            Publicado por anfitrión
          </p>
        )}
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
        <p className="mt-4 text-sm font-semibold text-[var(--pine)] transition group-hover:translate-x-0.5">
          Ver disponibilidad →
        </p>
      </div>
    </Link>
  );
}
