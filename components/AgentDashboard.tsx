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
  /** Close the sheet (modal). When set, explore/host actions dismiss instead of routing away blindly. */
  onDismiss?: () => void;
  compact?: boolean;
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
  onDismiss,
  compact = false,
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

  const sectionPad = compact ? "p-3.5" : "p-5";
  const sectionTitle = compact ? "text-base" : "text-lg";

  return (
    <div className={compact ? "space-y-4" : "space-y-6"}>
      <header>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pine)] sm:text-xs">
            Tu agente
          </p>
          <StatusBadge status={agentStatus} />
        </div>
        <h1
          className={`mt-1.5 leading-tight text-[var(--ink)] ${
            compact
              ? "text-xl sm:text-2xl"
              : "text-[clamp(1.9rem,5vw,3rem)]"
          }`}
          style={{ fontFamily: "var(--font-display)" }}
        >
          {hasAgent ? "Todo lo que tiene tu agente" : "Creá tu agente"}
        </h1>
        <p
          className={`mt-1.5 max-w-xl leading-relaxed text-[var(--muted)] ${
            compact ? "text-xs sm:text-sm" : "text-sm sm:text-base"
          }`}
        >
          {hasAgent
            ? "Saldo, wallet, World y tope — todo acá, sin salir de la página."
            : "Un click crea una wallet CDP solo para este navegador. Después la fondeás, la verificás con World y definís hasta cuánto puede pagar solo."}
        </p>
      </header>

      <GuestProgress current={progress} compact={compact} />

      {hasAgent && (
        <section
          className={
            compact ? "grid grid-cols-3 gap-2" : "grid gap-3 sm:grid-cols-3"
          }
        >
          <StatCard
            compact={compact}
            label="Saldo USDC"
            value={
              usdc != null ? `$${usdc.toFixed(compact ? 2 : 4)}` : "…"
            }
            hint={
              funded
                ? compact
                  ? "Listo"
                  : "Alcanza para reservar"
                : `Mín. ~$${me?.balances?.minUsdcToFund ?? 0.05}`
            }
            ok={funded}
          />
          <StatCard
            compact={compact}
            label="ETH (gas)"
            value={eth != null ? `${eth.toFixed(5)}` : "…"}
            hint={compact ? "Sepolia" : "Base Sepolia"}
          />
          <StatCard
            compact={compact}
            label="Tope auto"
            value={autoLimit != null ? `$${autoLimit}` : "—"}
            hint={
              registered
                ? compact
                  ? "HITL arriba"
                  : "Arriba pide World"
                : compact
                  ? "Definilo"
                  : "Definilo después de World"
            }
          />
        </section>
      )}

      {hasAgent && me?.address && (
        <section className={`border border-[var(--line)] bg-[var(--surface)] ${sectionPad}`}>
          <h2
            className={`${sectionTitle} text-[var(--ink)]`}
            style={{ fontFamily: "var(--font-display)" }}
          >
            Wallet del agente
          </h2>
          <p
            className={`mt-1 break-all font-mono text-xs text-[var(--muted)] ${
              compact ? "hidden sm:block" : ""
            }`}
          >
            {me.address}
            <span className="ml-2 hidden sm:inline">
              ({shortAddress(me.address)})
            </span>
          </p>
          <div className={`mt-4 ${compact ? "mt-3" : "mt-4"}`}>
            <AgentFundPanel
              address={me.address}
              balances={me.balances ?? null}
              fundHint={me.fundHint}
              onRefresh={onRefreshBalances}
              refreshing={refreshingBalances}
              compact={compact}
            />
          </div>
        </section>
      )}

      {!hasAgent && (
        <section className={`border border-[var(--line)] bg-[var(--surface)] ${sectionPad}`}>
          <h2
            className={`${sectionTitle} text-[var(--ink)]`}
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
        <section className={`border border-[var(--line)] bg-[var(--surface)] ${sectionPad}`}>
          <h2
            className={`${sectionTitle} text-[var(--ink)]`}
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
        <section className={`border border-[var(--line)] bg-[var(--surface)] ${sectionPad}`}>
          <h2
            className={`${sectionTitle} text-[var(--ink)]`}
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

      <section className={`border border-[var(--line)] bg-[var(--surface)] ${sectionPad}`}>
        <h2
          className={`${sectionTitle} text-[var(--ink)]`}
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
        <div className={`flex flex-wrap ${compact ? "mt-3 gap-2" : "mt-5 gap-3"}`}>
          {onDismiss ? (
            <button
              type="button"
              onClick={onDismiss}
              className="bg-[var(--pine)] px-4 py-2.5 text-sm font-semibold text-white"
            >
              Listo — seguir acá
            </button>
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
            onClick={() => onDismiss?.()}
            className="border border-[var(--clay)] px-4 py-2.5 text-sm font-semibold text-[var(--clay)]"
          >
            Modo anfitrión
          </Link>
          <Link
            href="/como-funciona"
            onClick={() => onDismiss?.()}
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
  compact = false,
}: {
  label: string;
  value: string;
  hint?: string;
  ok?: boolean;
  compact?: boolean;
}) {
  return (
    <div
      className={`border border-[var(--line)] bg-[var(--surface)] ${
        compact ? "px-2 py-2.5 sm:p-4" : "p-4"
      }`}
    >
      <p
        className={`font-semibold uppercase tracking-[0.08em] text-[var(--muted)] ${
          compact ? "text-[9px] sm:text-[10px]" : "text-[10px] tracking-[0.12em]"
        }`}
      >
        {label}
      </p>
      <p
        className={`mt-1 tabular-nums text-[var(--ink)] ${
          compact ? "truncate text-[15px] sm:text-2xl" : "text-2xl"
        }`}
        style={{ fontFamily: "var(--font-display)" }}
      >
        {value}
      </p>
      {hint && (
        <p
          className={`mt-0.5 truncate ${
            compact ? "text-[10px]" : "text-xs"
          } ${ok ? "text-[var(--pine)]" : "text-[var(--muted)]"}`}
        >
          {hint}
        </p>
      )}
    </div>
  );
}
