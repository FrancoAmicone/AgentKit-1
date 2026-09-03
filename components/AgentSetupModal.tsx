"use client";

import Link from "next/link";
import { FormEvent, useId } from "react";
import { AgentDashboard } from "@/components/AgentDashboard";
import {
  StatusBadge,
  type AgentStatus,
  type LimitsResponse,
} from "@/components/AgentStatusBadge";
import { Modal } from "@/components/ui/Modal";
import type { AgentMe } from "@/hooks/useAgentSession";

export type { AgentStatus, LimitsResponse };
export { StatusBadge };

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

  return (
    <Modal open={open} onClose={onClose} labelledBy={titleId} size="lg">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p id={titleId} className="sr-only">
          Tu agente
        </p>
        <Link
          href="/agent"
          onClick={onClose}
          className="text-xs font-semibold text-[var(--pine)] underline underline-offset-2"
        >
          Abrir página completa
        </Link>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 px-2 py-1 text-sm font-semibold text-[var(--muted)] hover:text-[var(--ink)]"
        >
          Cerrar
        </button>
      </div>
      <AgentDashboard
        me={me}
        agentStatus={agentStatus}
        limitsInfo={limitsInfo}
        limitInput={limitInput}
        onLimitInputChange={onLimitInputChange}
        savingLimit={savingLimit}
        limitMessage={limitMessage}
        onSaveLimit={onSaveLimit}
        onRefresh={onRefresh}
        onCreateAgent={onCreateAgent}
        creating={creating}
        createMessage={createMessage}
        onRefreshBalances={onRefreshBalances}
        refreshingBalances={refreshingBalances}
      />
    </Modal>
  );
}
