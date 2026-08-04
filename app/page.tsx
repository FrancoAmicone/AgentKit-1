"use client";

import { FormEvent, useState } from "react";

type ListingResult = {
  id: string;
  title: string;
  location: string;
  pricePerNight: number;
  amenities: string[];
  rating: number;
  imageUrl: string;
  matchReason?: string;
};

type SearchResponse = {
  explanation: string;
  parser: string;
  results: ListingResult[];
  count: number;
};

type PurchaseResponse = {
  ok: boolean;
  error?: string;
  hint?: string;
  agentAddress?: string;
  txHash?: string;
  explorerUrl?: string;
  listing?: {
    id: string;
    title: string;
    location: string;
    amountUsdc: number;
  };
  reservation?: {
    reservedAt: string;
  };
};

export default function HomePage() {
  const [query, setQuery] = useState(
    "Casa en Bariloche con pileta, menos de 150 USD por día",
  );
  const [searching, setSearching] = useState(false);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [search, setSearch] = useState<SearchResponse | null>(null);
  const [purchase, setPurchase] = useState<PurchaseResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSearch(e: FormEvent) {
    e.preventDefault();
    setSearching(true);
    setError(null);
    setPurchase(null);
    try {
      const res = await fetch("/api/agent/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = (await res.json()) as SearchResponse & { error?: string };
      if (!res.ok) throw new Error(data.error || "Search failed");
      setSearch(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de búsqueda");
    } finally {
      setSearching(false);
    }
  }

  async function onBuy(listingId: string) {
    setBuyingId(listingId);
    setError(null);
    setPurchase(null);
    try {
      const res = await fetch("/api/agent/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      });
      const data = (await res.json()) as PurchaseResponse;
      if (!res.ok || !data.ok) {
        throw new Error(data.error || data.hint || "No se pudo completar el pago");
      }
      setPurchase(data);
      // refresh search so reserved listing disappears
      const refresh = await fetch("/api/agent/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      if (refresh.ok) setSearch((await refresh.json()) as SearchResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de compra");
    } finally {
      setBuyingId(null);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-5 py-10 sm:px-8">
      <header className="mb-10 max-w-2xl">
        <p className="mb-3 text-sm font-medium tracking-wide text-[var(--pine)]">
          StayAgent · Fase 1
        </p>
        <h1
          className="text-4xl leading-tight text-[var(--ink)] sm:text-5xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Pedí un lugar. El agente lo reserva y paga onchain.
        </h1>
        <p className="mt-4 text-base leading-relaxed text-[var(--muted)]">
          Búsqueda en lenguaje natural sobre un catálogo propio. La reserva se
          cobra en USDC (Base Sepolia) con la wallet del agente vía x402 + CDP.
        </p>
      </header>

      <form
        onSubmit={onSearch}
        className="mb-8 flex flex-col gap-3 rounded-2xl border border-[var(--line)] bg-white/70 p-4 shadow-[0_20px_60px_rgba(26,36,33,0.06)] backdrop-blur sm:flex-row sm:items-center"
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ej: loft en Ushuaia con wifi, menos de 80"
          className="min-w-0 flex-1 rounded-xl border border-[var(--line)] bg-[var(--paper)] px-4 py-3 text-[var(--ink)] outline-none ring-[var(--pine)] focus:ring-2"
        />
        <button
          type="submit"
          disabled={searching}
          className="rounded-xl bg-[var(--pine)] px-5 py-3 font-semibold text-white transition hover:bg-[var(--pine-deep)] disabled:opacity-60"
        >
          {searching ? "Buscando…" : "Buscar"}
        </button>
      </form>

      {search && (
        <p className="mb-6 text-sm text-[var(--muted)]">
          {search.explanation}{" "}
          <span className="text-[var(--ink)]/50">({search.parser} · {search.count} resultados)</span>
        </p>
      )}

      {error && (
        <div className="mb-6 rounded-xl border border-[var(--danger)]/30 bg-[var(--danger)]/8 px-4 py-3 text-sm text-[var(--danger)]">
          {error}
        </div>
      )}

      {purchase?.ok && (
        <section className="mb-8 rounded-2xl border border-[var(--pine)]/25 bg-[var(--pine)]/8 p-5">
          <h2
            className="text-2xl text-[var(--pine-deep)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Reserva confirmada
          </h2>
          <p className="mt-2 text-[var(--ink)]">
            {purchase.listing?.title} · ${purchase.listing?.amountUsdc} USDC
          </p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {purchase.listing?.location}
            {purchase.reservation?.reservedAt
              ? ` · ${new Date(purchase.reservation.reservedAt).toLocaleString()}`
              : ""}
          </p>
          {purchase.agentAddress && (
            <p className="mt-3 break-all text-xs text-[var(--muted)]">
              Wallet del agente: {purchase.agentAddress}
            </p>
          )}
          {purchase.explorerUrl ? (
            <a
              href={purchase.explorerUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-block text-sm font-semibold text-[var(--pine)] underline"
            >
              Ver tx en Basescan Sepolia
            </a>
          ) : purchase.txHash ? (
            <p className="mt-3 break-all text-xs">tx: {purchase.txHash}</p>
          ) : (
            <p className="mt-3 text-xs text-[var(--muted)]">
              Pago liquidado (revisá payment meta / facilitator si no hay hash).
            </p>
          )}
        </section>
      )}

      <section className="grid gap-5 sm:grid-cols-2">
        {search?.results.map((listing) => (
          <article
            key={listing.id}
            className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white/80 shadow-[0_12px_40px_rgba(26,36,33,0.05)]"
          >
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
                <p className="mt-3 text-sm text-[var(--pine-deep)]">{listing.matchReason}</p>
              )}
              <button
                type="button"
                onClick={() => onBuy(listing.id)}
                disabled={buyingId === listing.id}
                className="mt-4 w-full rounded-xl bg-[var(--ink)] px-4 py-2.5 text-sm font-semibold text-[var(--paper)] transition hover:bg-[var(--pine-deep)] disabled:opacity-60"
              >
                {buyingId === listing.id ? "Pagando con el agente…" : "Reservar y pagar"}
              </button>
            </div>
          </article>
        ))}
      </section>

      {!search && (
        <p className="mt-6 text-sm text-[var(--muted)]">
          Tip: corré <code className="rounded bg-black/5 px-1.5 py-0.5">npm run setup:wallets</code>{" "}
          y fondeá USDC testnet antes de pagar.
        </p>
      )}

      <footer className="mt-auto pt-16 text-xs text-[var(--muted)]">
        Fase 1 · sin World ID · sin 0G · Base Sepolia + x402 + CDP Server Wallet
      </footer>
    </main>
  );
}
