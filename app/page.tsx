"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { ListingCard, type ListingCardData } from "@/components/ListingCard";
import { useAgent } from "@/components/AgentSessionProvider";

type SearchResponse = {
  explanation: string;
  parser: string;
  results: ListingCardData[];
  count: number;
};

const SUGGESTIONS = [
  "Casa en Bariloche con pileta, menos de 150 USD",
  "Loft en Ushuaia con wifi",
  "Algo cerca del mar para las vacaciones",
  "Cabaña con parrilla en Córdoba",
];

export default function HomePage() {
  const agent = useAgent();
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [search, setSearch] = useState<SearchResponse | null>(null);
  const [catalog, setCatalog] = useState<ListingCardData[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/listings");
        const data = (await res.json()) as { listings: ListingCardData[] };
        if (!cancelled && Array.isArray(data.listings)) {
          setCatalog(data.listings);
        }
      } catch {
        // catalog stays empty; search still works
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function runSearch(text: string) {
    setSearching(true);
    setError(null);
    try {
      const res = await fetch("/api/agent/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: text }),
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

  function onSearch(e: FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    void runSearch(query);
  }

  const showing = search ? search.results : catalog;
  const needsSetup = !agent.canPurchase;

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col px-5 pb-10 pt-8 sm:px-8 sm:pt-12">
      {/* Hero */}
      <header className="stay-rise mb-8 max-w-3xl">
        <h1
          className="text-[clamp(2.5rem,7vw,4.25rem)] leading-[0.98] tracking-tight text-[var(--ink)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Tu agente reserva.
          <br />
          Vos viajás.
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-[var(--muted)] sm:text-lg">
          Marketplace de estadías con pago onchain: pedí un lugar en lenguaje
          natural y tu agente lo reserva y paga en USDC. ¿Tenés una propiedad?
          Publicala y cobrá directo en tu wallet.
        </p>
      </header>

      {/* Two sides */}
      <section className="stay-rise-delay mb-10 grid gap-4 sm:grid-cols-2">
        <div className="border border-[var(--line)] bg-[var(--surface)] p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--pine)]">
            Soy huésped
          </p>
          <h2
            className="mt-1 text-xl text-[var(--ink)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Buscá y reservá con tu agente
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
            Elegí fechas en el calendario público, y tu agente paga la reserva
            con su propia wallet (con tu tope y tu aprobación).
          </p>
          <a
            href="#buscar"
            className="mt-4 inline-block bg-[var(--pine)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--pine-deep)]"
          >
            Buscar estadía
          </a>
        </div>
        <div className="border border-[var(--line)] bg-[var(--surface)] p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--clay)]">
            Soy anfitrión
          </p>
          <h2
            className="mt-1 text-xl text-[var(--ink)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Publicá tu propiedad y cobrá onchain
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
            Cargá tu casa o depto, definí el precio por noche y mirá cómo se
            bloquean las fechas cuando un agente paga la reserva.
          </p>
          <Link
            href="/host"
            className="mt-4 inline-block border border-[var(--clay)] px-4 py-2 text-sm font-semibold text-[var(--clay)] transition hover:bg-[var(--clay)] hover:text-white"
          >
            Ir al modo anfitrión
          </Link>
        </div>
      </section>

      {/* Search */}
      <form
        id="buscar"
        onSubmit={onSearch}
        className="stay-rise-delay mb-3 flex scroll-mt-24 flex-col gap-3 border border-[var(--line)] bg-[var(--surface)] p-2 backdrop-blur-sm sm:flex-row sm:items-stretch"
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ej: loft en Ushuaia con wifi, menos de 80"
          className="min-w-0 flex-1 bg-transparent px-4 py-3 text-[var(--ink)] outline-none placeholder:text-[var(--muted)]/70"
          aria-label="Qué lugar buscás"
        />
        <button
          type="submit"
          disabled={searching}
          className="bg-[var(--pine)] px-6 py-3 font-semibold text-white transition hover:bg-[var(--pine-deep)] disabled:opacity-60"
        >
          {searching ? "Buscando…" : "Buscar"}
        </button>
      </form>

      <div className="mb-8 flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              setQuery(s);
              void runSearch(s);
            }}
            className="border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--muted)] transition hover:border-[var(--pine)]/35 hover:text-[var(--pine)]"
          >
            {s}
          </button>
        ))}
      </div>

      {needsSetup && (
        <p className="stay-fade mb-6 text-sm text-[var(--muted)]">
          Para pagar reservas, primero{" "}
          <button
            type="button"
            onClick={() => agent.setSetupOpen(true)}
            className="font-semibold text-[var(--pine)] underline underline-offset-2"
          >
            configurá tu agente
          </button>{" "}
          (crear · fondear · World · tope). Mirar disponibilidad es libre.
        </p>
      )}

      {error && (
        <div className="stay-fade mb-6 border border-[var(--danger)]/25 bg-[var(--danger)]/8 px-4 py-3 text-sm text-[var(--danger)]">
          {error}
        </div>
      )}

      <div className="stay-fade mb-5 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2
            className="text-2xl text-[var(--ink)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {search ? "Resultados" : "Todos los alojamientos"}
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {search
              ? search.explanation
              : "Cada lugar tiene su calendario público de disponibilidad."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch(null);
                setQuery("");
              }}
              className="text-xs font-semibold text-[var(--pine)] underline underline-offset-2"
            >
              Ver todo
            </button>
          )}
          <p className="text-xs text-[var(--muted)]">
            {showing.length} lugares
          </p>
        </div>
      </div>

      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {showing.map((listing, index) => (
          <ListingCard key={listing.id} listing={listing} index={index} />
        ))}
      </section>

      {search && showing.length === 0 && (
        <p className="text-sm text-[var(--muted)]">
          Nada con esos filtros. Probá otra búsqueda o mirá el catálogo
          completo.
        </p>
      )}

      <p className="mt-10 text-sm text-[var(--muted)]">
        Tip demo: $0.05/noche auto-paga bajo el tope · $0.2/noche pide
        aprobación en World · el recibo va a 0G.{" "}
        <Link
          href="/como-funciona"
          className="font-semibold text-[var(--pine)] underline underline-offset-2"
        >
          Cómo funciona
        </Link>
      </p>
    </main>
  );
}
