"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AgentSetupModal } from "@/components/AgentSetupModal";
import { useAgentSession } from "@/hooks/useAgentSession";

type AgentSession = ReturnType<typeof useAgentSession>;

const AgentSessionContext = createContext<AgentSession | null>(null);

/**
 * One agent session for the whole app: any page can read the buyer agent's
 * state. Setup lives on /agent; the modal is a fallback sheet.
 */
export function AgentSessionProvider({ children }: { children: ReactNode }) {
  const agent = useAgentSession();
  const pathname = usePathname();
  const closeSetup = agent.setSetupOpen;

  useEffect(() => {
    closeSetup(false);
  }, [pathname, closeSetup]);

  return (
    <AgentSessionContext.Provider value={agent}>
      {children}
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
        onCreateAgent={() => {
          void agent.createAgent();
        }}
        creating={agent.creating}
        createMessage={agent.createMessage}
        onRefreshBalances={() => {
          void agent.refreshBalances();
        }}
        refreshingBalances={agent.refreshingBalances}
      />
    </AgentSessionContext.Provider>
  );
}

export function useAgent(): AgentSession {
  const ctx = useContext(AgentSessionContext);
  if (!ctx) {
    throw new Error("useAgent must be used inside <AgentSessionProvider>");
  }
  return ctx;
}
