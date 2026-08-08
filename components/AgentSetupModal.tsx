"use client";

import { FormEvent, useId } from "react";
import { AgentFundPanel } from "@/components/AgentFundPanel";
import { AgentRegisterPanel } from "@/components/AgentRegisterPanel";
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

  const step: StepId = !hasAgent
    ? "create"
    : !funded
      ? "fund"
      : needsRegister
        ? "world"
        : "tope";

  const copy = STEP_COPY[step];

  return (
    <Modal open={open} onClose={onClose} labelledBy={titleId} size="lg">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--pine)]">
            StayAgent · setup
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

      <ol className="mb-6 grid grid-cols-4 gap-1.5">
        {(
          [
            ["create", "Crear", hasAgent],
            ["fund", "Fondos", funded],
            ["world", "World", registered],
            ["tope", "Tope", topeSaved && registered],
          ] as const
        ).map(([id, label, done]) => (
          <li key={id}>
            <div
              className={`border px-2 py-2 text-center text-[11px] font-semibold tracking-wide ${
                step === id
                  ? "border-[var(--pine)] bg-[var(--pine)] text-white"
                  : done
                    ? "border-[var(--pine)]/25 bg-[var(--pine)]/10 text-[var(--pine-deep)]"
                    : "border-[var(--line)] bg-white/40 text-[var(--muted)]"
              }`}
            >
              {done && step !== id ? "✓ " : ""}
              {label}
            </div>
          </li>
        ))}
      </ol>

      {hasAgent && me?.address && step !== "create" && (
        <p className="mb-4 break-all font-mono text-[11px] text-[var(--muted)]">
          {shortAddress(me.address)}
          <StatusBadge status={agentStatus} className="ml-2 align-middle" />
        </p>
      )}

      {step === "create" && (
        <section className="stay-fade">
          <p className="text-sm leading-relaxed text-[var(--muted)]">
            Creamos una wallet CDP solo para este navegador. Vos la fondeás; el
            agente firma los pagos automáticos.
          </p>
          <button
            type="button"
            onClick={onCreateAgent}
            disabled={creating}
            className="mt-5 w-full bg-[var(--pine)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--pine-deep)] disabled:opacity-60"
          >
            {creating ? "Creando…" : "Crear mi agente"}
          </button>
          {createMessage && (
            <p className="mt-3 text-xs text-[var(--pine-deep)]">{createMessage}</p>
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
        <section className="stay-fade">
          <AgentRegisterPanel onRegistered={onRefresh} />
        </section>
      )}

      {step === "tope" && (
        <section className="stay-fade">
          {registered && (
            <p className="mb-4 text-sm text-[var(--pine-deep)]">
              Human-backed ✓ — definí hasta cuánto puede pagar solo.
            </p>
          )}
          <form onSubmit={onSaveLimit} className="space-y-4">
            <p className="text-sm leading-relaxed text-[var(--muted)]">
              ≤ este monto paga solo. Arriba pide aprobación en World App. Mín. $
              {minLimit}.
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
                className="w-36 border border-[var(--line)] bg-white px-3 py-2.5 text-sm outline-none ring-[var(--pine)] focus:ring-2 disabled:opacity-50"
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
            <p className="text-xs text-[var(--muted)]">
              Actual: {autoLimit != null ? `$${autoLimit} USDC` : "…"}
            </p>
            {limitMessage && (
              <p className="text-xs font-medium text-[var(--pine-deep)]">
                {limitMessage}
              </p>
            )}
          </form>
          <button
            type="button"
            onClick={onClose}
            className="mt-6 w-full bg-[var(--ink)] px-5 py-3 text-sm font-semibold text-[var(--paper)]"
          >
            Listo — ir a buscar
          </button>
        </section>
      )}
    </Modal>
  );
}

const STEP_COPY: Record<StepId, { title: string; subtitle: string }> = {
  create: {
    title: "Creá tu agente",
    subtitle: "Una wallet propia para que StayAgent pague por vos.",
  },
  fund: {
    title: "Cargá fondos",
    subtitle: "Enviá USDC de prueba (Base Sepolia) a la address del agente.",
  },
  world: {
    title: "Verificá con World",
    subtitle: "Vinculá el agente a tu World ID (AgentBook).",
  },
  tope: {
    title: "Definí el tope",
    subtitle: "Límite de pago automático. Arriba de eso: aprobación humana.",
  },
};

function shortAddress(address: string) {
  if (address.length < 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

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
      <span className={`${base} bg-black/5 text-[var(--muted)]`}>Checando…</span>
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
      <span className={`${base} bg-black/5 text-[var(--muted)]`}>Gate off</span>
    );
  }
  if (status.registered) {
    return (
      <span className={`${base} bg-[var(--pine)]/15 text-[var(--pine-deep)]`}>
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
