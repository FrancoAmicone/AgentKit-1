"use client";

import { FormEvent, useState } from "react";
import {
  AgentSetupModal,
  StatusBadge,
} from "@/components/AgentSetupModal";
import { ListingCard, type ListingCardData } from "@/components/ListingCard";
import { PurchaseApprovalModal } from "@/components/PurchaseApprovalModal";
import { ReservationReceipt } from "@/components/ReservationReceipt";
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
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de compra");
      agent.refreshAll();
    } finally {
      setBuyingId(null);
    }
  }

  const needsSetup = !agent.canPurchase;

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-5 pb-10 pt-6 sm:px-8 sm:pt-8">
      <div className="mb-6 flex items-center justify-end">
        <button
          type="button"
          onClick={() => agent.setSetupOpen(true)}
          className="inline-flex items-center gap-2 border border-[var(--line)] bg-white/50 px-3 py-1.5 transition hover:border-[var(--pine)]/35 hover:bg-white/80"
        >
          <StatusBadge status={agent.agentStatus} />
          <span className="text-xs font-semibold text-[var(--pine)]">
            Configurar
          </span>
        </button>
      </div>

      {/* First composition: brand + one line + search CTA */}
      <header className="stay-rise mb-8 max-w-3xl">
        <h1
          className="text-[clamp(2.75rem,8vw,4.75rem)] leading-[0.95] tracking-tight text-[var(--ink)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          StayAgent
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-[var(--muted)] sm:text-lg">
          Pedí un lugar. Tu agente lo reserva y paga onchain.
        </p>
      </header>

      <form
        onSubmit={onSearch}
        className="stay-rise-delay mb-8 flex flex-col gap-3 border border-[var(--line)] bg-white/55 p-2 backdrop-blur-sm sm:flex-row sm:items-stretch"
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

      {needsSetup && !search && (
        <p className="stay-fade mb-8 text-sm text-[var(--muted)]">
          Antes de pagar:{" "}
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
        <div className="stay-fade mb-6 border border-[var(--danger)]/25 bg-[var(--danger)]/8 px-4 py-3 text-sm text-[var(--danger)]">
          {error}{" "}
          {(error.includes("aprobación") ||
            error.includes("Register") ||
            error.includes("human") ||
            error.includes("agente")) && (
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

      {purchase?.ok && <ReservationReceipt purchase={purchase} />}

      {search && (
        <div className="stay-fade mb-5 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2
              className="text-2xl text-[var(--ink)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Lugares
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {search.explanation}
            </p>
          </div>
          <p className="text-xs text-[var(--muted)]">
            {search.count} resultados
          </p>
        </div>
      )}

      <section className="grid gap-5 sm:grid-cols-2">
        {search?.results.map((listing, index) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            index={index}
            autoLimitUsdc={agent.autoLimitUsdc}
            canPurchase={agent.canPurchase}
            buying={buyingId === listing.id}
            onBuy={(item) => void onBuy(item)}
            onNeedSetup={() => agent.setSetupOpen(true)}
          />
        ))}
      </section>

      {!search && !purchase?.ok && (
        <p className="mt-2 text-sm text-[var(--muted)]">
          Tip demo: $0.05 auto-paga · $0.2 pide World · recibo en 0G.
        </p>
      )}

      <footer className="mt-auto pt-16 text-xs tracking-wide text-[var(--muted)]">
        Base Sepolia · x402 · World · 0G Storage
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
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      )}
    </main>
  );
}
