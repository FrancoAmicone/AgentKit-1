"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useAgentSession } from "@/hooks/useAgentSession";

type AgentSession = ReturnType<typeof useAgentSession>;

const AgentSessionContext = createContext<AgentSession | null>(null);

/**
 * Buyer agent session for the whole app. “Mi agente” is the /agent page —
 * there is no setup modal (it broke scroll on phones).
 */
export function AgentSessionProvider({ children }: { children: ReactNode }) {
  const agent = useAgentSession();

  return (
    <AgentSessionContext.Provider value={agent}>
      {children}
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
