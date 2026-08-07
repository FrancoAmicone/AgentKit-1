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
  const autoLimit = limitsInfo?.limits?.autoPayLimitUsdc ?? me?.limits?.autoPayLimitUsdc;
  const hasAgent = Boolean(me?.hasAgent && me.address);
  const funded = Boolean(me?.balances?.funded);
  const registered =
    Boolean(me?.registered) || agentStatus?.registered === true;
  const needsRegister =
    hasAgent && Boolean(me?.required ?? agentStatus?.required) && !registered;

  return (
    <Modal open={open} onClose={onClose} labelledBy={titleId} size="lg">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--pine)]">
            Configurar agente
          </p>
          <h2
            id={titleId}
            className="mt-1 text-2xl text-[var(--ink)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Tu agente, tu wallet
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Creá una wallet CDP propia, cargá USDC, verificá con World y
            definí el tope de pago automático.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-lg px-2 py-1 text-sm font-semibold text-[var(--muted)] hover:bg-black/5"
        >
          Cerrar
        </button>
      </div>

      <ol className="mb-4 flex flex-wrap gap-2 text-xs font-semibold">
        <StepChip n={1} label="Crear" done={hasAgent} />
        <StepChip n={2} label="Fondos" done={funded} />
        <StepChip n={3} label="World" done={registered} />
        <StepChip n={4} label="Tope" done={Boolean(limitsInfo?.limits)} />
      </ol>

      {/* Step 1 — Create */}
      <section className="mb-4 rounded-xl border border-[var(--line)] bg-white/70 p-3">
        <p className="text-sm font-semibold text-[var(--ink)]">1. Crear agente</p>
        {!hasAgent ? (
          <>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Se crea una wallet CDP exclusiva para este navegador. El servidor
              firma los pagos automáticos; vos solo la fondeás.
            </p>
            <button
              type="button"
              onClick={onCreateAgent}
              disabled={creating}
              className="mt-3 rounded-xl bg-[var(--pine)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {creating ? "Creando…" : "Crear mi agente"}
            </button>
          </>
        ) : (
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs text-[var(--muted)]">Wallet del agente</p>
              <p className="mt-0.5 break-all font-mono text-xs text-[var(--ink)]">
                {me?.address}
              </p>
            </div>
            <StatusBadge status={agentStatus} />
          </div>
        )}
        {createMessage && (
          <p className="mt-2 text-xs text-[var(--pine-deep)]">{createMessage}</p>
        )}
      </section>

      {/* Step 2 — Fund */}
      {hasAgent && me?.address && (
        <section className="mb-4">
          <AgentFundPanel
            address={me.address}
            balances={me.balances ?? null}
            fundHint={me.fundHint}
            onRefresh={onRefreshBalances}
            refreshing={refreshingBalances}
          />
        </section>
      )}

      {/* Step 3 — World */}
      {hasAgent && (
        <section className="mb-4">
          {needsRegister ? (
            <AgentRegisterPanel onRegistered={onRefresh} />
          ) : (
            <div className="rounded-xl bg-[var(--pine)]/10 px-3 py-2 text-sm text-[var(--pine-deep)]">
              3. Agente human-backed ✓ — listo para pagar bajo el tope.
            </div>
          )}
        </section>
      )}

      {/* Step 4 — Tope */}
      {hasAgent && (
        <form
          onSubmit={onSaveLimit}
          className="rounded-xl border border-[var(--line)] bg-white/70 p-3"
        >
          <p className="text-sm font-semibold text-[var(--ink)]">
            4. Tope de pago automático
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Paga solo si el listing cuesta ≤ este monto (mín. ${minLimit};
            default $0.1). Arriba de eso pide aprobación humana en World App
            (HITL).
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm text-[var(--muted)]">$</span>
              <input
                type="number"
                min={minLimit}
                step="0.01"
                value={limitInput}
                onChange={(e) => onLimitInputChange(e.target.value)}
                disabled={!limitsInfo?.canEdit && needsRegister}
                className="w-32 rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-sm outline-none ring-[var(--pine)] focus:ring-2 disabled:opacity-50"
              />
              <span className="text-sm text-[var(--muted)]">USDC</span>
            </div>
            <button
              type="submit"
              disabled={savingLimit || (needsRegister && !limitsInfo?.canEdit)}
              className="rounded-xl bg-[var(--pine)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--pine-deep)] disabled:opacity-60"
            >
              {savingLimit ? "Guardando…" : "Guardar tope"}
            </button>
          </div>
          <p className="mt-2 text-xs text-[var(--muted)]">
            Actual:{" "}
            {autoLimit != null ? `$${autoLimit} USDC` : "cargando…"}
            {needsRegister && " · Registrá el agente para editar el tope."}
          </p>
          {limitMessage && (
            <p className="mt-2 text-xs font-medium text-[var(--pine-deep)]">
              {limitMessage}
            </p>
          )}
        </form>
      )}

      <p className="mt-4 text-xs text-[var(--muted)]">
        {agentStatus?.note ||
          "El USDC lo recibe el marketplace en Base. 0G guarda el recibo de la reserva."}
      </p>

      <div className="mt-5 flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl bg-[var(--ink)] px-5 py-2.5 text-sm font-semibold text-[var(--paper)]"
        >
          Listo
        </button>
      </div>
    </Modal>
  );
}

function StepChip({
  n,
  label,
  done,
}: {
  n: number;
  label: string;
  done: boolean;
}) {
  return (
    <li
      className={`rounded-full px-2.5 py-1 ${
        done
          ? "bg-[var(--pine)]/15 text-[var(--pine-deep)]"
          : "bg-black/5 text-[var(--muted)]"
      }`}
    >
      {n}. {label}
      {done ? " ✓" : ""}
    </li>
  );
}

export function StatusBadge({ status }: { status: AgentStatus | null }) {
  if (!status) {
    return (
      <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-semibold text-[var(--muted)]">
        Checando…
      </span>
    );
  }
  if (status.needsCreate) {
    return (
      <span className="rounded-full bg-[var(--clay)]/15 px-3 py-1 text-xs font-semibold text-[var(--clay)]">
        Sin agente
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
