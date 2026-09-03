"use client";

import { FormEvent, useId } from "react";
import { AgentFundPanel } from "@/components/AgentFundPanel";
import { AgentRegisterPanel } from "@/components/AgentRegisterPanel";
import {
  GuestProgress,
  guestStepFromFlags,
} from "@/components/GuestProgress";
import { Modal } from "@/components/ui/Modal";
import type { AgentMe } from "@/hooks/useAgentSession";

export type AgentStatus = {
  ok: boolean;
  address?: string;
  registered?: boolean;
  humanId?: string | null;
  required?: boolean;
  registerHint?: string;
  note?: string;
  error?: string;
  needsCreate?: boolean;
  hasAgent?: boolean;
};

export type LimitsResponse = {
  ok: boolean;
  canEdit?: boolean;
  needsCreate?: boolean;
  minAutoPayLimitUsdc?: number;
  maxAutoPayLimitUsdc?: number;
  limits?: {
    autoPayLimitUsdc: number;
    source: "default" | "owner";
    updatedAt: string;
  };
  error?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  me: AgentMe | null;
  agentStatus: AgentStatus | null;
  limitsInfo: LimitsResponse | null;
  limitInput: string;
  onLimitInputChange: (value: string) => void;
  savingLimit: boolean;
  limitMessage: string | null;
  onSaveLimit: (e: FormEvent) => void;
  onRefresh: () => void;
  onCreateAgent: () => void;
  creating: boolean;
  createMessage: string | null;
  onRefreshBalances: () => void;
  refreshingBalances: boolean;
};

type StepId = "create" | "fund" | "world" | "tope";

export function AgentSetupModal({
  open,
  onClose,
  me,
  agentStatus,
  limitsInfo,
  limitInput,
  onLimitInputChange,
  savingLimit,
  limitMessage,
  onSaveLimit,
  onRefresh,
  onCreateAgent,
  creating,
  createMessage,
  onRefreshBalances,
  refreshingBalances,
}: Props) {
  const titleId = useId();
  const minLimit = limitsInfo?.minAutoPayLimitUsdc ?? 0.01;
  const autoLimit =
    limitsInfo?.limits?.autoPayLimitUsdc ?? me?.limits?.autoPayLimitUsdc;
  const hasAgent = Boolean(me?.hasAgent && me.address);
  const funded = Boolean(me?.balances?.funded);
  const registered =
    Boolean(me?.registered) || agentStatus?.registered === true;
  const needsRegister =
    hasAgent && Boolean(me?.required ?? agentStatus?.required) && !registered;
  const topeSaved = Boolean(limitsInfo?.limits || me?.limits);
  const worldRequired = Boolean(me?.required ?? agentStatus?.required ?? true);

  const progress = guestStepFromFlags({
    hasAgent,
    funded,
    registered: registered || !worldRequired,
    topeSaved,
  });
  const step: StepId = progress === "ready" ? "tope" : progress;
  const copy = STEP_COPY[step];

  return (
    <Modal open={open} onClose={onClose} labelledBy={titleId} size="lg">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--pine)]">
            StayAgent · tu agente
          </p>
          <h2
            id={titleId}
            className="mt-1 text-2xl text-[var(--ink)] sm:text-3xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {copy.title}
          </h2>
          <p className="mt-1 max-w-sm text-sm leading-relaxed text-[var(--muted)]">
            {copy.subtitle}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 px-2 py-1 text-sm font-semibold text-[var(--muted)] hover:text-[var(--ink)]"
        >
          Cerrar
        </button>
      </div>

      <GuestProgress current={progress} />

      {hasAgent && me?.address && step !== "create" && (
        <p className="mb-4 break-all font-mono text-[11px] text-[var(--muted)]">
          {shortAddress(me.address)}
          <StatusBadge status={agentStatus} className="ml-2 align-middle" />
        </p>
      )}

      {step === "create" && (
        <section className="stay-fade space-y-4">
          <p className="text-sm leading-relaxed text-[var(--muted)]">
            En un click creamos una{" "}
            <strong className="text-[var(--ink)]">wallet CDP</strong> solo para
            este navegador. Después vas a{" "}
            <strong className="text-[var(--ink)]">copiar esa address</strong>,
            mandarle USDC de prueba, verificarla con World y poner un tope.
          </p>
          <ul className="space-y-1.5 text-xs text-[var(--muted)]">
            <li>· Cada persona tiene su propio agente (no se comparte).</li>
            <li>· Es Base Sepolia: testnet, sin dinero real.</li>
            <li>· Vos controlás el tope; el agente firma los pagos.</li>
          </ul>
          <button
            type="button"
            onClick={onCreateAgent}
            disabled={creating}
            className="w-full bg-[var(--pine)] px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-[var(--pine-deep)] disabled:opacity-60"
          >
            {creating ? "Creando…" : "1 · Crear mi agente"}
          </button>
          {createMessage && (
            <p className="text-xs text-[var(--pine)]">{createMessage}</p>
          )}
        </section>
      )}

      {step === "fund" && hasAgent && me?.address && (
        <section className="stay-fade">
          <AgentFundPanel
            address={me.address}
            balances={me.balances ?? null}
            fundHint={me.fundHint}
            onRefresh={onRefreshBalances}
            refreshing={refreshingBalances}
          />
        </section>
      )}

      {step === "world" && (
        <section className="stay-fade space-y-3">
          <p className="text-sm leading-relaxed text-[var(--muted)]">
            Vinculamos la wallet del agente a tu{" "}
            <strong className="text-[var(--ink)]">World ID</strong>. En el
            teléfono abrimos World App directo (sin QR).
          </p>
          <AgentRegisterPanel onRegistered={onRefresh} />
        </section>
      )}

      {step === "tope" && (
        <section className="stay-fade">
          {registered && (
            <p className="mb-4 text-sm text-[var(--pine)]">
              Human-backed ✓ — último paso: el tope automático.
            </p>
          )}
          <form onSubmit={onSaveLimit} className="space-y-4">
            <p className="text-sm leading-relaxed text-[var(--muted)]">
              Hasta este monto el agente{" "}
              <strong className="text-[var(--ink)]">paga solo</strong>. Si la
              reserva es más cara, te pide OK en World App. Mín. ${minLimit}.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-[var(--muted)]">$</span>
              <input
                type="number"
                min={minLimit}
                step="0.01"
                value={limitInput}
                onChange={(e) => onLimitInputChange(e.target.value)}
                disabled={!limitsInfo?.canEdit && needsRegister}
                className="w-36 border border-[var(--line)] bg-[var(--surface-strong)] px-3 py-2.5 text-sm outline-none ring-[var(--pine)] focus:ring-2 disabled:opacity-50"
              />
              <span className="text-sm text-[var(--muted)]">USDC</span>
              <button
                type="submit"
                disabled={
                  savingLimit || (needsRegister && !limitsInfo?.canEdit)
                }
                className="bg-[var(--pine)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--pine-deep)] disabled:opacity-60"
              >
                {savingLimit ? "Guardando…" : "Guardar tope"}
              </button>
            </div>
            <p className="text-xs text-[var(--muted)]">
              Actual: {autoLimit != null ? `$${autoLimit} USDC` : "…"} · tip
              demo: $0.1 deja pasar $0.05 y pide World en $0.2
            </p>
            {limitMessage && (
              <p className="text-xs font-medium text-[var(--pine)]">
                {limitMessage}
              </p>
            )}
          </form>
          <button
            type="button"
            onClick={onClose}
            className="mt-6 w-full bg-[var(--ink)] px-5 py-3.5 text-sm font-semibold text-[var(--paper)]"
          >
            Listo — ir a buscar estadías
          </button>
        </section>
      )}
    </Modal>
  );
}

const STEP_COPY: Record<StepId, { title: string; subtitle: string }> = {
  create: {
    title: "Paso 1 · Creá tu agente",
    subtitle:
      "Una wallet propia para que StayAgent pague las reservas por vos.",
  },
  fund: {
    title: "Paso 2 · Fondeá con copy-paste",
    subtitle:
      "Copiá la wallet, pegala en el faucet o tu wallet, mandá USDC de prueba.",
  },
  world: {
    title: "Paso 3 · Verificá con World",
    subtitle:
      "Un humano detrás del agente. En el teléfono abrimos World App directo.",
  },
  tope: {
    title: "Paso 4 · Definí el tope",
    subtitle: "Límite de pago automático. Arriba de eso: tu OK en World.",
  },
};

function shortAddress(address: string) {
  if (address.length < 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/** Exported for SiteHeader chip. */
export function StatusBadge({
  status,
  className = "",
}: {
  status: AgentStatus | null;
  className?: string;
}) {
  const base =
    "inline-flex rounded-sm px-2 py-0.5 text-[11px] font-semibold " + className;
  if (!status) {
    return (
      <span className={`${base} bg-white/5 text-[var(--muted)]`}>Checando…</span>
    );
  }
  if (status.needsCreate) {
    return (
      <span className={`${base} bg-[var(--clay)]/15 text-[var(--clay)]`}>
        Sin agente
      </span>
    );
  }
  if (!status.ok) {
    return (
      <span className={`${base} bg-[var(--danger)]/10 text-[var(--danger)]`}>
        Error
      </span>
    );
  }
  if (!status.required) {
    return (
      <span className={`${base} bg-white/5 text-[var(--muted)]`}>Gate off</span>
    );
  }
  if (status.registered) {
    return (
      <span className={`${base} bg-[var(--pine)]/15 text-[var(--pine)]`}>
        Human-backed
      </span>
    );
  }
  return (
    <span className={`${base} bg-[var(--clay)]/15 text-[var(--clay)]`}>
      Sin World
    </span>
  );
}
