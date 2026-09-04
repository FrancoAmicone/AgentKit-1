"use client";

import Link from "next/link";
import { FormEvent, useState, useTransition } from "react";
import { ListingCard, type ListingCardData } from "@/components/ListingCard";
import { useAgent } from "@/components/AgentSessionProvider";
import {
  GuestProgress,
  guestStepFromFlags,
} from "@/components/GuestProgress";

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

export function HomeExplorer({
  initialCatalog,
}: {
  initialCatalog: ListingCardData[];
}) {
  const agent = useAgent();
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState<SearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function runSearch(text: string) {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/agent/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: text }),
          signal: AbortSignal.timeout(20_000),
        });
        const data = (await res.json()) as SearchResponse & { error?: string };
        if (!res.ok) throw new Error(data.error || "Search failed");
        setSearch(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error de búsqueda");
      }
    });
  }

  function onSearch(e: FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    void runSearch(query);
  }

  const showing = search ? search.results : initialCatalog;
  const needsSetup = !agent.canPurchase;
  const me = agent.me;
  const hasAgent = Boolean(me?.hasAgent && me.address);
  const funded = Boolean(me?.balances?.funded);
  const registered =
    Boolean(me?.registered) || agent.agentStatus?.registered === true;
  const worldRequired = Boolean(
    me?.required ?? agent.agentStatus?.required ?? true,
  );
  const topeSaved = Boolean(agent.limitsInfo?.limits || me?.limits);
  const progress = guestStepFromFlags({
    hasAgent,
    funded,
    registered: registered || !worldRequired,
    topeSaved,
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col px-5 pb-16 pt-8 sm:px-8 sm:pt-12">
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
          Pedí un lugar en lenguaje natural. Tu agente paga en USDC onchain.
          ¿Tenés una propiedad? Publicala con tu wallet y cobrá cuando los
          agentes reservan.
        </p>
      </header>

      <section className="stay-rise-delay mb-8 border border-[var(--line)] bg-[var(--surface)] p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--pine)]">
              Empezá acá · huésped
            </p>
            <h2
              className="mt-1 text-xl text-[var(--ink)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {progress === "ready"
                ? "Tu agente está listo para pagar"
                : "Configurá tu agente en 4 pasos"}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
              {progress === "create" &&
                "Creá el agente → copiá su wallet → fondeala con USDC de prueba → verificá con World → definí el tope."}
              {progress === "fund" &&
                "Copiá la wallet del agente y pegala en el faucet / tu wallet. Después actualizá el saldo."}
              {progress === "world" &&
                "Abrí World App en este teléfono para vincular al agente con tu identidad."}
              {progress === "tope" &&
                "Definí cuánto puede gastar solo. Arriba de ese tope te pide aprobación."}
              {progress === "ready" &&
                "Buscá abajo, elegí fechas en la ficha y dejá que el agente pague."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => agent.setSetupOpen(true)}
            className="shrink-0 bg-[var(--pine)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--pine-deep)]"
          >
            {progress === "ready" ? "Ver mi agente" : "Continuar setup"}
          </button>
        </div>
        <div className="mt-4">
          <GuestProgress current={progress} />
        </div>
      </section>

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
            Elegí fechas en el calendario público. El agente paga con su wallet
            (con tu tope y, si hace falta, tu OK en World).
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href="#buscar"
              className="inline-block bg-[var(--pine)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--pine-deep)]"
            >
              Buscar estadía
            </a>
            {needsSetup && (
              <button
                type="button"
                onClick={() => agent.setSetupOpen(true)}
                className="inline-block border border-[var(--pine)] px-4 py-2 text-sm font-semibold text-[var(--pine)]"
              >
                Primero: crear agente
              </button>
            )}
          </div>
        </div>
        <div className="border border-[var(--line)] bg-[var(--surface)] p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--clay)]">
            Soy anfitrión
          </p>
          <h2
            className="mt-1 text-xl text-[var(--ink)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Publicá y cobrá en tu wallet
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
            Registrá una wallet de cobro (podés dedicársela a una propiedad),
            verificála con World y publicá. Cuando un agente paga, el USDC llega
            ahí.
          </p>
          <Link
            href="/host"
            className="mt-4 inline-block border border-[var(--clay)] px-4 py-2 text-sm font-semibold text-[var(--clay)] transition hover:bg-[var(--clay)] hover:text-[var(--paper)]"
          >
            Ir al modo anfitrión
          </Link>
        </div>
      </section>

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
          disabled={isPending}
          className="bg-[var(--pine)] px-6 py-3 font-semibold text-white transition hover:bg-[var(--pine-deep)] disabled:opacity-60"
        >
          {isPending ? "Buscando…" : "Buscar"}
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
