"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  AgentSetupModal,
  StatusBadge,
  type AgentStatus,
  type LimitsResponse,
} from "@/components/AgentSetupModal";

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
  registerHint?: string;
  code?: string;
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
  const [agentStatus, setAgentStatus] = useState<AgentStatus | null>(null);
  const [limitsInfo, setLimitsInfo] = useState<LimitsResponse | null>(null);
  const [limitInput, setLimitInput] = useState("0.1");
  const [savingLimit, setSavingLimit] = useState(false);
  const [limitMessage, setLimitMessage] = useState<string | null>(null);
  const [setupOpen, setSetupOpen] = useState(false);
  const [autoOpenedSetup, setAutoOpenedSetup] = useState(false);

  const refreshAgentStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/agent/status");
      const data = (await res.json()) as AgentStatus;
      setAgentStatus(data);
    } catch {
      setAgentStatus({ ok: false, error: "No se pudo leer el status del agente" });
    }
  }, []);

  const refreshLimits = useCallback(async () => {
    try {
      const res = await fetch("/api/agent/limits");
      const data = (await res.json()) as LimitsResponse;
      setLimitsInfo(data);
      if (data.limits?.autoPayLimitUsdc != null) {
        setLimitInput(String(data.limits.autoPayLimitUsdc));
      }
    } catch {
      setLimitsInfo({ ok: false, error: "No se pudieron cargar los límites" });
    }
  }, []);

  const refreshAll = useCallback(() => {
    void refreshAgentStatus();
    void refreshLimits();
  }, [refreshAgentStatus, refreshLimits]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Prompt setup when human-backed gate is on and agent is not registered yet.
  useEffect(() => {
    if (autoOpenedSetup || !agentStatus?.ok) return;
    if (agentStatus.required && agentStatus.registered !== true) {
      setSetupOpen(true);
      setAutoOpenedSetup(true);
    }
  }, [agentStatus, autoOpenedSetup]);

  async function onSaveLimit(e: FormEvent) {
    e.preventDefault();
    setSavingLimit(true);
    setLimitMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/agent/limits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoPayLimitUsdc: Number(limitInput) }),
      });
      const data = (await res.json()) as LimitsResponse & {
        registerHint?: string;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        throw new Error(
          [data.error, data.registerHint].filter(Boolean).join(" — ") ||
            "No se pudo guardar el límite",
        );
      }
      setLimitsInfo(data);
      if (data.limits?.autoPayLimitUsdc != null) {
        setLimitInput(String(data.limits.autoPayLimitUsdc));
      }
      setLimitMessage(
        `Límite guardado: pago automático hasta $${data.limits?.autoPayLimitUsdc} USDC`,
      );
    } catch (err) {
      setLimitMessage(err instanceof Error ? err.message : "Error al guardar límite");
    } finally {
      setSavingLimit(false);
    }
  }

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
        if (data.code === "AGENT_NOT_HUMAN_BACKED") {
          setSetupOpen(true);
        }
        if (data.code === "NEEDS_HUMAN_APPROVAL") {
          setSetupOpen(true);
        }
        const parts = [data.error, data.hint, data.registerHint].filter(Boolean);
        throw new Error(parts.join(" — ") || "No se pudo completar el pago");
      }
      setPurchase(data);
      refreshAll();
      const refresh = await fetch("/api/agent/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      if (refresh.ok) setSearch((await refresh.json()) as SearchResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de compra");
      refreshAll();
    } finally {
      setBuyingId(null);
    }
  }

  const canPurchase =
    agentStatus?.ok &&
    (!agentStatus.required || agentStatus.registered === true);

  const autoLimit = limitsInfo?.limits?.autoPayLimitUsdc;
  const minLimit = limitsInfo?.minAutoPayLimitUsdc ?? 0.01;

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-5 py-10 sm:px-8">
      <header className="mb-8 max-w-2xl">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-medium tracking-wide text-[var(--pine)]">
            StayAgent
          </p>
          <button
            type="button"
            onClick={() => setSetupOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--line)] bg-white/70 px-3 py-1.5 text-left transition hover:border-[var(--pine)]/40"
          >
            <StatusBadge status={agentStatus} />
            <span className="text-xs font-semibold text-[var(--pine)]">
              Configurar
            </span>
          </button>
        </div>
        <h1
          className="text-4xl leading-tight text-[var(--ink)] sm:text-5xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Pedí un lugar. El agente lo reserva y paga onchain.
        </h1>
        <p className="mt-4 text-base leading-relaxed text-[var(--muted)]">
          Buscá libremente. Para pagar hace falta verificación humana del
          agente y que el monto entre en tu tope (default $0.1 USDC).
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
          <span className="text-[var(--ink)]/50">
            ({search.parser} · {search.count} resultados)
          </span>
        </p>
      )}

      {error && (
        <div className="mb-6 rounded-xl border border-[var(--danger)]/30 bg-[var(--danger)]/8 px-4 py-3 text-sm text-[var(--danger)]">
          {error}{" "}
          {(error.includes("aprobación") ||
            error.includes("Register") ||
            error.includes("human")) && (
            <button
              type="button"
              onClick={() => setSetupOpen(true)}
              className="font-semibold underline"
            >
              Abrir configuración
            </button>
          )}
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
        {search?.results.map((listing) => {
          const overLimit =
            autoLimit != null && listing.pricePerNight > autoLimit;
          return (
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
                  <p className="mt-3 text-sm text-[var(--pine-deep)]">
                    {listing.matchReason}
                  </p>
                )}
                {overLimit && (
                  <p className="mt-2 text-xs font-medium text-[var(--clay)]">
                    Supera tu tope automático (${autoLimit} USDC) — requiere
                    aprobación humana (Step C) o subir el tope.
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (!canPurchase) {
                      setSetupOpen(true);
                      return;
                    }
                    void onBuy(listing.id);
                  }}
                  disabled={buyingId === listing.id}
                  className="mt-4 w-full rounded-xl bg-[var(--ink)] px-4 py-2.5 text-sm font-semibold text-[var(--paper)] transition hover:bg-[var(--pine-deep)] disabled:opacity-60"
                >
                  {buyingId === listing.id
                    ? "Pagando con el agente…"
                    : !canPurchase
                      ? "Verificar agente para pagar"
                      : overLimit
                        ? "Intentar pago (pide aprobación)"
                        : "Reservar y pagar"}
                </button>
              </div>
            </article>
          );
        })}
      </section>

      {!search && (
        <p className="mt-6 text-sm text-[var(--muted)]">
          Tip: tope default $0.1 → $0.05 paga solo; buscá “Casa frente al lago”
          ($0.2) o Mendoza ($2) para ver el bloqueo por tope.
        </p>
      )}

      <footer className="mt-auto pt-16 text-xs text-[var(--muted)]">
        AgentBook + auto-pay (default $0.1, min ${minLimit}) · marketplace sin
        verificación · Base Sepolia + x402 + CDP
      </footer>

      <AgentSetupModal
        open={setupOpen}
        onClose={() => setSetupOpen(false)}
        agentStatus={agentStatus}
        limitsInfo={limitsInfo}
        limitInput={limitInput}
        onLimitInputChange={setLimitInput}
        savingLimit={savingLimit}
        limitMessage={limitMessage}
        onSaveLimit={onSaveLimit}
        onRefresh={refreshAll}
      />
    </main>
  );
}
