"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { AgentDashboard } from "@/components/AgentDashboard";
import { useAgent } from "@/components/AgentSessionProvider";

export default function AgentPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto min-h-screen max-w-3xl px-5 pb-10 pt-8 sm:px-8">
          <p className="text-sm text-[var(--muted)]">Cargando tu agente…</p>
        </main>
      }
    >
      <AgentPageInner />
    </Suspense>
  );
}

function AgentPageInner() {
  const agent = useAgent();
  const searchParams = useSearchParams();
  const nextHref = useMemo(() => {
    const raw = searchParams.get("next");
    if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return null;
    return raw;
  }, [searchParams]);

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-5 pb-10 pt-8 sm:px-8">
      <AgentDashboard
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
        nextHref={nextHref}
      />
    </main>
  );
}
