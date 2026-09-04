"use client";

import dynamic from "next/dynamic";
import { Component, useEffect, useId, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useAgent } from "@/components/AgentSessionProvider";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";

const AgentDashboardLazy = dynamic(
  () =>
    import("@/components/AgentDashboard").then((m) => m.AgentDashboard),
  {
    ssr: false,
    loading: () => (
      <p className="text-sm text-[var(--muted)]">Cargando el panel…</p>
    ),
  },
);

/**
 * In-place sheet for “Mi agente”. Sibling of `.app-root` so position:fixed
 * works. The chrome (title + Cerrar) is always in the small layout bundle;
 * the dashboard chunk loads only after the sheet is open.
 */
export function AgentModal() {
  const titleId = useId();
  const pathname = usePathname();
  const agent = useAgent();
  const { setupOpen, setSetupOpen } = agent;
  const pathRef = useRef(pathname);

  useBodyScrollLock(setupOpen);

  useEffect(() => {
    if (pathRef.current === pathname) return;
    pathRef.current = pathname;
    setSetupOpen(false);
  }, [pathname, setSetupOpen]);

  useEffect(() => {
    if (!setupOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSetupOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setupOpen, setSetupOpen]);

  if (!setupOpen) return null;

  return (
    <div
      className="stay-modal-root fixed inset-0 z-[10000] flex items-end justify-center sm:items-center sm:p-4"
      role="presentation"
      data-agent-modal=""
    >
      <button
        type="button"
        aria-label="Cerrar"
        className="absolute inset-0 bg-[rgba(2,6,12,0.78)] backdrop-blur-[2px]"
        onClick={() => setSetupOpen(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative isolate max-h-[min(92dvh,840px)] w-full max-w-2xl overflow-y-auto overscroll-contain rounded-t-2xl border border-[var(--line)] bg-[var(--sand)] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.55)] sm:rounded-xl sm:p-6"
        style={{ WebkitOverflowScrolling: "touch" }}
        onClick={(event) => event.stopPropagation()}
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
          <AgentDashboardLazy
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
      </div>
    </div>
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
