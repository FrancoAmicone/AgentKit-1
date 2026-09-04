"use client";

import Link from "next/link";
import { FormEvent } from "react";
import { AgentFundPanel } from "@/components/AgentFundPanel";
import { AgentRegisterPanel } from "@/components/AgentRegisterPanel";
import {
  StatusBadge,
  type AgentStatus,
  type LimitsResponse,
} from "@/components/AgentStatusBadge";
import {
  GuestProgress,
  guestStepFromFlags,
} from "@/components/GuestProgress";
import type { AgentMe } from "@/hooks/useAgentSession";

type Props = {
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
  /** Optional back-link after setup (e.g. return to a stay). */
  nextHref?: string | null;
};

function shortAddress(address: string) {
  if (address.length < 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function AgentDashboard({
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
  nextHref,
}: Props) {
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
  const ready = hasAgent && funded && (!needsRegister || registered);
  const usdc = me?.balances?.usdc;
  const eth = me?.balances?.eth;
  const progress = guestStepFromFlags({
    hasAgent,
    funded,
    registered: registered || !needsRegister,
    topeSaved,
  });

  return (
    <div className="space-y-6">
      <header>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--pine)]">
            Tu agente
          </p>
          <StatusBadge status={agentStatus} />
        </div>
        <h1
          className="mt-2 text-[clamp(1.9rem,5vw,3rem)] leading-tight text-[var(--ink)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {hasAgent ? "Todo lo que tiene tu agente" : "Creá tu agente"}
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--muted)] sm:text-base">
          {hasAgent
            ? "Acá ves el saldo, la wallet, World y el tope. Todo vive en esta página — no hay modal."
            : "Un click crea una wallet CDP solo para este navegador. Después la fondeás, la verificás con World y definís hasta cuánto puede pagar solo."}
        </p>
      </header>

      <GuestProgress current={progress} />

      {hasAgent && (
        <section className="grid gap-3 sm:grid-cols-3">
          <StatCard
            label="Saldo USDC"
            value={usdc != null ? `$${usdc.toFixed(4)}` : "…"}
            hint={
              funded
                ? "Alcanza para reservar"
                : `Mínimo ~$${me?.balances?.minUsdcToFund ?? 0.05}`
            }
            ok={funded}
          />
          <StatCard
            label="ETH (gas)"
            value={eth != null ? `${eth.toFixed(5)}` : "…"}
            hint="Base Sepolia"
          />
          <StatCard
            label="Tope automático"
            value={autoLimit != null ? `$${autoLimit}` : "—"}
            hint={registered ? "Arriba pide World" : "Definilo después de World"}
          />
        </section>
      )}

      {hasAgent && me?.address && (
        <section className="border border-[var(--line)] bg-[var(--surface)] p-5">
          <h2
            className="text-lg text-[var(--ink)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Wallet del agente
          </h2>
          <p className="mt-1 break-all font-mono text-xs text-[var(--muted)]">
            {me.address}
            <span className="ml-2 hidden sm:inline">
              ({shortAddress(me.address)})
            </span>
          </p>
          <div className="mt-4">
            <AgentFundPanel
              address={me.address}
              balances={me.balances ?? null}
              fundHint={me.fundHint}
              onRefresh={onRefreshBalances}
              refreshing={refreshingBalances}
            />
          </div>
        </section>
      )}

      {!hasAgent && (
        <section className="border border-[var(--line)] bg-[var(--surface)] p-5">
          <h2
            className="text-lg text-[var(--ink)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            1 · Crear
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
            Creamos una wallet CDP solo para este navegador. Vos la fondeás;
            el agente firma los pagos automáticos.
          </p>
          <button
            type="button"
            onClick={onCreateAgent}
            disabled={creating}
            className="mt-4 w-full bg-[var(--pine)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--pine-deep)] disabled:opacity-60"
          >
            {creating ? "Creando…" : "Crear mi agente"}
          </button>
          {createMessage && (
            <p className="mt-3 text-xs text-[var(--pine)]">{createMessage}</p>
          )}
        </section>
      )}

      {hasAgent && (
        <section className="border border-[var(--line)] bg-[var(--surface)] p-5">
          <h2
            className="text-lg text-[var(--ink)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            World / AgentBook
          </h2>
          {registered ? (
            <p className="mt-2 text-sm text-[var(--pine)]">
              Human-backed ✓
              {me?.humanId ? ` · ${me.humanId}` : ""}
            </p>
          ) : (
            <div className="mt-3">
              <AgentRegisterPanel onRegistered={onRefresh} />
            </div>
          )}
        </section>
      )}

      {hasAgent && (
        <section className="border border-[var(--line)] bg-[var(--surface)] p-5">
          <h2
            className="text-lg text-[var(--ink)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Tope de auto-pago
          </h2>
          <form onSubmit={onSaveLimit} className="mt-3 space-y-3">
            <p className="text-sm leading-relaxed text-[var(--muted)]">
              Hasta este monto el agente paga solo. Si la reserva lo supera,
              te pide aprobación en World App. Mín. ${minLimit}.
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
                disabled={savingLimit || (needsRegister && !limitsInfo?.canEdit)}
                className="bg-[var(--pine)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--pine-deep)] disabled:opacity-60"
              >
                {savingLimit ? "Guardando…" : "Guardar tope"}
              </button>
            </div>
            {limitMessage && (
              <p className="text-xs font-medium text-[var(--pine)]">
                {limitMessage}
              </p>
            )}
          </form>
        </section>
      )}

      <section className="border border-[var(--line)] bg-[var(--surface)] p-5">
        <h2
          className="text-lg text-[var(--ink)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Qué puede hacer ahora
        </h2>
        <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
          <li>Ver el catálogo y la disponibilidad — siempre, sin agente.</li>
          <li>
            {ready
              ? "Pagar una reserva en USDC — listo."
              : "Pagar una reserva — falta completar los pasos de arriba."}
          </li>
          <li>
            Si el total supera el tope, te pide OK en World App y después paga.
          </li>
        </ul>
        <div className="mt-5 flex flex-wrap gap-3">
          {nextHref ? (
            <Link
              href={nextHref}
              className="bg-[var(--pine)] px-4 py-2.5 text-sm font-semibold text-white"
            >
              Volver a la reserva
            </Link>
          ) : (
            <Link
              href="/"
              className="bg-[var(--pine)] px-4 py-2.5 text-sm font-semibold text-white"
            >
              Ir a explorar
            </Link>
          )}
          <Link
            href="/host"
            className="border border-[var(--clay)] px-4 py-2.5 text-sm font-semibold text-[var(--clay)]"
          >
            Modo anfitrión
          </Link>
          <Link
            href="/como-funciona"
            className="px-4 py-2.5 text-sm font-semibold text-[var(--pine)] underline underline-offset-2"
          >
            Cómo funciona
          </Link>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  ok,
}: {
  label: string;
  value: string;
  hint?: string;
  ok?: boolean;
}) {
  return (
    <div className="border border-[var(--line)] bg-[var(--surface)] p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
        {label}
      </p>
      <p
        className="mt-1 text-2xl text-[var(--ink)]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {value}
      </p>
      {hint && (
        <p
          className={`mt-1 text-xs ${
            ok ? "text-[var(--pine)]" : "text-[var(--muted)]"
          }`}
        >
          {hint}
        </p>
      )}
    </div>
  );
}
