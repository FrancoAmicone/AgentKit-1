"use client";

import { Component, useEffect, useId, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AgentDashboard } from "@/components/AgentDashboard";
import { useAgent } from "@/components/AgentSessionProvider";
import { Modal } from "@/components/ui/Modal";

/**
 * In-place sheet for “Mi agente”. Stays on the current route so the catalog
 * (or stay, or host panel) is still there when you close it.
 */
export function AgentModal() {
  const titleId = useId();
  const pathname = usePathname();
  const agent = useAgent();
  const { setupOpen, setSetupOpen } = agent;
  const pathRef = useRef(pathname);

  useEffect(() => {
    if (pathRef.current === pathname) return;
    pathRef.current = pathname;
    setSetupOpen(false);
  }, [pathname, setSetupOpen]);

  return (
    <Modal
      open={setupOpen}
      onClose={() => setSetupOpen(false)}
      labelledBy={titleId}
      size="xl"
    >
      <div className="sticky top-0 z-10 -mx-4 mb-4 flex items-center justify-between border-b border-[var(--line)] bg-[var(--sand)] px-4 py-3 sm:-mx-6 sm:px-6">
        <h2
          id={titleId}
          className="text-base font-semibold text-[var(--ink)] sm:text-lg"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Mi agente
        </h2>
        <button
          type="button"
          onClick={() => setSetupOpen(false)}
          className="px-2 py-1 text-sm font-semibold text-[var(--muted)] hover:text-[var(--ink)]"
        >
          Cerrar
        </button>
      </div>
      <AgentErrorBoundary>
        <AgentDashboard
          compact
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
          onDismiss={() => setSetupOpen(false)}
        />
      </AgentErrorBoundary>
    </Modal>
  );
}

class AgentErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="border border-[var(--danger)]/25 bg-[var(--danger)]/8 px-4 py-3 text-sm text-[var(--danger)]">
          <p>No se pudo mostrar el agente.</p>
          <button
            type="button"
            className="mt-3 font-semibold underline underline-offset-2"
            onClick={() => this.setState({ error: null })}
          >
            Reintentar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
