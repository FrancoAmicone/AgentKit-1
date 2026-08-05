"use client";

import { FormEvent, useId } from "react";
import { AgentRegisterPanel } from "@/components/AgentRegisterPanel";
import { Modal } from "@/components/ui/Modal";

export type AgentStatus = {
  ok: boolean;
  address?: string;
  registered?: boolean;
  humanId?: string | null;
  required?: boolean;
  registerHint?: string;
  note?: string;
  error?: string;
};

export type LimitsResponse = {
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

type Props = {
  open: boolean;
  onClose: () => void;
  agentStatus: AgentStatus | null;
  limitsInfo: LimitsResponse | null;
  limitInput: string;
  onLimitInputChange: (value: string) => void;
  savingLimit: boolean;
  limitMessage: string | null;
  onSaveLimit: (e: FormEvent) => void;
  onRefresh: () => void;
};

export function AgentSetupModal({
  open,
  onClose,
  agentStatus,
  limitsInfo,
  limitInput,
  onLimitInputChange,
  savingLimit,
  limitMessage,
  onSaveLimit,
  onRefresh,
}: Props) {
  const titleId = useId();
  const minLimit = limitsInfo?.minAutoPayLimitUsdc ?? 0.01;
  const autoLimit = limitsInfo?.limits?.autoPayLimitUsdc;
  const needsRegister =
    Boolean(agentStatus?.required) && agentStatus?.registered !== true;

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
            Verificación y tope
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Human-backed es obligatorio para pagar. Ajustá el tope de pago
            automático acá.
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

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] pb-4">
        <div className="min-w-0">
          <p className="text-xs font-medium text-[var(--muted)]">
            Wallet del agente
          </p>
          <p className="mt-0.5 break-all font-mono text-xs text-[var(--ink)]">
            {agentStatus?.address || "cargando…"}
          </p>
        </div>
        <StatusBadge status={agentStatus} />
      </div>

      {needsRegister ? (
        <AgentRegisterPanel onRegistered={onRefresh} />
      ) : (
        <div className="mb-4 rounded-xl bg-[var(--pine)]/10 px-3 py-2 text-sm text-[var(--pine-deep)]">
          Agente human-backed ✓ — ya podés pagar bajo el tope automático.
        </div>
      )}

      <form
        onSubmit={onSaveLimit}
        className="mt-4 rounded-xl border border-[var(--line)] bg-white/70 p-3"
      >
        <p className="text-sm font-semibold text-[var(--ink)]">
          Tope de pago automático
        </p>
        <p className="mt-1 text-xs text-[var(--muted)]">
          Paga solo si el listing cuesta ≤ este monto (mín. ${minLimit};
          default $0.1). Arriba de eso pide aprobación humana en World App
          (HITL) antes de pagar.
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

      <p className="mt-4 text-xs text-[var(--muted)]">
        {agentStatus?.note ||
          "Solo se verifica el agente que compra. El receiver/marketplace no."}
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

export function StatusBadge({ status }: { status: AgentStatus | null }) {
  if (!status) {
    return (
      <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-semibold text-[var(--muted)]">
        Checando…
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
