"use client";

import { FormEvent, useState } from "react";
import {
  AgentSetupModal,
  StatusBadge,
} from "@/components/AgentSetupModal";
import { ListingCard, type ListingCardData } from "@/components/ListingCard";
import { PurchaseApprovalModal } from "@/components/PurchaseApprovalModal";
import { useAgentSession } from "@/hooks/useAgentSession";

type SearchResponse = {
  explanation: string;
  parser: string;
  results: ListingCardData[];
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
  usedHumanApproval?: boolean;
  ogReceipt?: {
    ok: boolean;
    skipped?: boolean;
    rootHash?: string;
    txHash?: string;
    storageScanUrl?: string;
    explorerUrl?: string;
    error?: string;
  };
};

export default function HomePage() {
  const agent = useAgentSession();
  const [query, setQuery] = useState(
    "Casa en Bariloche con pileta, menos de 150 USD por día",
  );
  const [searching, setSearching] = useState(false);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [search, setSearch] = useState<SearchResponse | null>(null);
  const [purchase, setPurchase] = useState<PurchaseResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [approvalListing, setApprovalListing] = useState<{
    id: string;
    title: string;
    amountUsdc: number;
    location?: string;
  } | null>(null);

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

  async function refreshSearchResults() {
    const refresh = await fetch("/api/agent/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    if (refresh.ok) setSearch((await refresh.json()) as SearchResponse);
  }

  async function onBuy(listing: ListingCardData) {
    setBuyingId(listing.id);
    setError(null);
    setPurchase(null);

    const autoLimit = agent.autoLimitUsdc;
    if (
      agent.canPurchase &&
      autoLimit != null &&
      listing.pricePerNight > autoLimit
    ) {
      setBuyingId(null);
      setApprovalListing({
        id: listing.id,
        title: listing.title,
        amountUsdc: listing.pricePerNight,
        location: listing.location,
      });
      return;
    }

    try {
      const res = await fetch("/api/agent/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: listing.id }),
      });
      const data = (await res.json()) as PurchaseResponse;
      if (!res.ok || !data.ok) {
        if (
          data.code === "AGENT_NOT_HUMAN_BACKED" ||
          data.code === "AGENT_NOT_CREATED"
        ) {
          agent.setSetupOpen(true);
        }
        if (data.code === "NEEDS_HUMAN_APPROVAL") {
          setApprovalListing({
            id: listing.id,
            title: listing.title,
            amountUsdc: listing.pricePerNight,
            location: listing.location,
          });
          setBuyingId(null);
          return;
        }
        const parts = [data.error, data.hint, data.registerHint].filter(Boolean);
        throw new Error(parts.join(" — ") || "No se pudo completar el pago");
      }
      setPurchase(data);
      agent.refreshAll();
      await refreshSearchResults();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de compra");
      agent.refreshAll();
    } finally {
      setBuyingId(null);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-5 py-10 sm:px-8">
      <header className="mb-8 max-w-2xl">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-medium tracking-wide text-[var(--pine)]">
            StayAgent
          </p>
          <button
            type="button"
            onClick={() => agent.setSetupOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--line)] bg-white/70 px-3 py-1.5 text-left transition hover:border-[var(--pine)]/40"
          >
            <StatusBadge status={agent.agentStatus} />
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
              onClick={() => agent.setSetupOpen(true)}
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
            {purchase.usedHumanApproval ? " · con aprobación humana" : ""}
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
          {purchase.ogReceipt?.ok && purchase.ogReceipt.rootHash ? (
            <p className="mt-3 break-all text-xs text-[var(--muted)]">
              Recibo 0G Storage:{" "}
              <span className="font-mono text-[var(--ink)]">
                {purchase.ogReceipt.rootHash}
              </span>
              {purchase.ogReceipt.storageScanUrl ? (
                <>
                  {" · "}
                  <a
                    href={purchase.ogReceipt.storageScanUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-[var(--pine)] underline"
                  >
                    Storage Scan
                  </a>
                </>
              ) : null}
              {purchase.ogReceipt.explorerUrl ? (
                <>
                  {" · "}
                  <a
                    href={purchase.ogReceipt.explorerUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-[var(--pine)] underline"
                  >
                    Tx 0G
                  </a>
                </>
              ) : null}
            </p>
          ) : purchase.ogReceipt?.skipped ? (
            <p className="mt-3 text-xs text-[var(--muted)]">
              Recibo 0G omitido (falta OG_PRIVATE_KEY — ver docs/13-env-and-0g-setup.md).
            </p>
          ) : purchase.ogReceipt?.error ? (
            <p className="mt-3 text-xs text-[var(--clay)]">
              Reserva OK · recibo 0G pendiente: {purchase.ogReceipt.error}
            </p>
          ) : null}
        </section>
      )}

      <section className="grid gap-5 sm:grid-cols-2">
        {search?.results.map((listing) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            autoLimitUsdc={agent.autoLimitUsdc}
            canPurchase={agent.canPurchase}
            buying={buyingId === listing.id}
            onBuy={(item) => void onBuy(item)}
            onNeedSetup={() => agent.setSetupOpen(true)}
          />
        ))}
      </section>

      {!search && (
        <p className="mt-6 text-sm text-[var(--muted)]">
          Tip: tope default $0.1 → $0.05 paga solo; listings a $0.2 piden
          aprobación humana (World App) y después pagan.
        </p>
      )}

      <footer className="mt-auto pt-16 text-xs text-[var(--muted)]">
        Tu agente CDP + AgentBook + tope (min ${agent.minLimitUsdc}) ·
        marketplace sin verificación · Base Sepolia + x402 · recibos 0G
      </footer>

      <AgentSetupModal
        open={agent.setupOpen}
        onClose={() => agent.setSetupOpen(false)}
        me={agent.me}
        agentStatus={agent.agentStatus}
        limitsInfo={agent.limitsInfo}
        limitInput={agent.limitInput}
        onLimitInputChange={agent.setLimitInput}
        savingLimit={agent.savingLimit}
        limitMessage={agent.limitMessage}
        onSaveLimit={agent.onSaveLimit}
        onRefresh={agent.refreshAll}
        onCreateAgent={() => void agent.createAgent()}
        creating={agent.creating}
        createMessage={agent.createMessage}
        onRefreshBalances={() => void agent.refreshBalances()}
        refreshingBalances={agent.refreshingBalances}
      />

      {approvalListing && (
        <PurchaseApprovalModal
          key={approvalListing.id}
          open
          listing={approvalListing}
          autoPayLimitUsdc={agent.autoLimitUsdc}
          onClose={() => setApprovalListing(null)}
          onApprovedPurchase={(result) => {
            setPurchase(result as PurchaseResponse);
            setApprovalListing(null);
            setError(null);
            agent.refreshAll();
            void refreshSearchResults();
          }}
        />
      )}
    </main>
  );
}
