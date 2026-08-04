"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

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

type AgentStatus = {
  ok: boolean;
  address?: string;
  registered?: boolean;
  humanId?: string | null;
  required?: boolean;
  registerHint?: string;
  note?: string;
  error?: string;
};

type LimitsResponse = {
  ok: boolean;
  canEdit?: boolean;
  minAutoPayLimitUsdc?: number;
  maxAutoPayLimitUsdc?: number;
  limits?: {
    autoPayLimitUsdc: number;
    source: "default" | "owner";
    updatedAt: string;
  };
  error?: string;
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

  useEffect(() => {
    void refreshAgentStatus();
    void refreshLimits();
  }, [refreshAgentStatus, refreshLimits]);

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
      setError(err instanceof Error ? err.message : "Error al guardar límite");
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
        const parts = [data.error, data.hint, data.registerHint].filter(Boolean);
        throw new Error(parts.join(" — ") || "No se pudo completar el pago");
      }
      setPurchase(data);
      void refreshAgentStatus();
      void refreshLimits();
      const refresh = await fetch("/api/agent/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      if (refresh.ok) setSearch((await refresh.json()) as SearchResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de compra");
      void refreshAgentStatus();
      void refreshLimits();
    } finally {
      setBuyingId(null);
    }
  }

  const canPurchase =
    agentStatus?.ok &&
    (!agentStatus.required || agentStatus.registered === true);

  const autoLimit = limitsInfo?.limits?.autoPayLimitUsdc;
  const minLimit = limitsInfo?.minAutoPayLimitUsdc ?? 1;

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-5 py-10 sm:px-8">
      <header className="mb-10 max-w-2xl">
        <p className="mb-3 text-sm font-medium tracking-wide text-[var(--pine)]">
          StayAgent · Fase 2B · Auto-pay limit
        </p>
        <h1
          className="text-4xl leading-tight text-[var(--ink)] sm:text-5xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Pedí un lugar. El agente lo reserva y paga onchain.
        </h1>
        <p className="mt-4 text-base leading-relaxed text-[var(--muted)]">
          Buscá libremente. Para pagar, el agente debe ser human-backed y el
          monto ≤ tope de pago automático (default $0.1 USDC; mínimo editable $
          {minLimit}).
        </p>
      </header>

      <section className="mb-6 rounded-2xl border border-[var(--line)] bg-white/70 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[var(--ink)]">Agente (payer)</p>
            <p className="mt-1 break-all text-xs text-[var(--muted)]">
              {agentStatus?.address || "cargando…"}
            </p>
          </div>
          <StatusBadge status={agentStatus} />
        </div>

        {agentStatus?.required && !agentStatus.registered && (
          <div className="mt-3 rounded-xl bg-[var(--sand)]/60 px-3 py-2 text-sm text-[var(--ink)]">
            <p className="font-medium">Falta registrar el agente en AgentBook</p>
            <p className="mt-1 text-[var(--muted)]">En tu máquina (con World App):</p>
            <code className="mt-2 block overflow-x-auto rounded-lg bg-black/5 px-2 py-1.5 text-xs">
              {agentStatus.registerHint ||
                "npx @worldcoin/agentkit-cli register <AGENT_WALLET_ADDRESS>"}
            </code>
            <button
              type="button"
              onClick={() => {
                void refreshAgentStatus();
                void refreshLimits();
              }}
              className="mt-3 text-sm font-semibold text-[var(--pine)] underline"
            >
              Ya lo registré — refrescar status
            </button>
          </div>
        )}

        <form
          onSubmit={onSaveLimit}
          className="mt-4 rounded-xl border border-[var(--line)] bg-[var(--paper)]/70 p-3"
        >
          <p className="text-sm font-semibold text-[var(--ink)]">
            Tope de pago automático
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            El agente paga solo si el listing cuesta ≤ este monto (mín. editable $
            {minLimit}; default $0.1). Arriba de eso se bloquea hasta Step C
            (aprobación humana).
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm text-[var(--muted)]">$</span>
              <input
                type="number"
                min={minLimit}
                step="0.01"
                value={limitInput}
                onChange={(e) => setLimitInput(e.target.value)}
                disabled={!limitsInfo?.canEdit}
                className="w-32 rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-sm outline-none ring-[var(--pine)] focus:ring-2 disabled:opacity-50"
              />
              <span className="text-sm text-[var(--muted)]">USDC</span>
            </div>
            <button
              type="submit"
              disabled={savingLimit || !limitsInfo?.canEdit}
              className="rounded-xl bg-[var(--pine)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--pine-deep)] disabled:opacity-60"
            >
              {savingLimit ? "Guardando…" : "Guardar tope"}
            </button>
          </div>
          <p className="mt-2 text-xs text-[var(--muted)]">
            Actual:{" "}
            {autoLimit != null
              ? `$${autoLimit} USDC (${limitsInfo?.limits?.source})`
              : "cargando…"}
            {!limitsInfo?.canEdit &&
              " · Registrá el agente para poder editar el tope."}
          </p>
          {limitMessage && (
            <p className="mt-2 text-xs font-medium text-[var(--pine-deep)]">
              {limitMessage}
            </p>
          )}
        </form>

        <p className="mt-3 text-xs text-[var(--muted)]">
          {agentStatus?.note ||
            "Solo se verifica el agente que compra. El receiver/marketplace no."}
        </p>
      </section>

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
                  onClick={() => onBuy(listing.id)}
                  disabled={buyingId === listing.id || !canPurchase}
                  className="mt-4 w-full rounded-xl bg-[var(--ink)] px-4 py-2.5 text-sm font-semibold text-[var(--paper)] transition hover:bg-[var(--pine-deep)] disabled:opacity-60"
                >
                  {buyingId === listing.id
                    ? "Pagando con el agente…"
                    : !canPurchase
                      ? "Registrá el agente para pagar"
                      : overLimit
                        ? "Intentar pago (puede pedir aprobación)"
                        : "Reservar y pagar"}
                </button>
              </div>
            </article>
          );
        })}
      </section>

      {!search && (
        <p className="mt-6 text-sm text-[var(--muted)]">
          Tip: registrá el agente, fondeá USDC testnet y reservá un listing de
          $0.05 (entra en el default $0.1). Probá Mendoza ($2) para ver el
          bloqueo por tope.
        </p>
      )}

      <footer className="mt-auto pt-16 text-xs text-[var(--muted)]">
        Fase 2B · AgentBook + auto-pay limit (default $0.1, min ${minLimit}) ·
        marketplace sin verificación · Base Sepolia + x402 + CDP
      </footer>
    </main>
  );
}

function StatusBadge({ status }: { status: AgentStatus | null }) {
  if (!status) {
    return (
      <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-semibold text-[var(--muted)]">
        Checando AgentBook…
      </span>
    );
  }
  if (!status.ok) {
    return (
      <span className="rounded-full bg-[var(--danger)]/10 px-3 py-1 text-xs font-semibold text-[var(--danger)]">
        Status error
      </span>
    );
  }
  if (!status.required) {
    return (
      <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-semibold text-[var(--muted)]">
        Gate off (dev)
      </span>
    );
  }
  if (status.registered) {
    return (
      <span className="rounded-full bg-[var(--pine)]/15 px-3 py-1 text-xs font-semibold text-[var(--pine-deep)]">
        Human-backed ✓
      </span>
    );
  }
  return (
    <span className="rounded-full bg-[var(--clay)]/15 px-3 py-1 text-xs font-semibold text-[var(--clay)]">
      Not registered
    </span>
  );
}
