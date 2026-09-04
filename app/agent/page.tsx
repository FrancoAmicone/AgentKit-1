"use client";

import { AgentDashboard } from "@/components/AgentDashboard";
import { useAgent } from "@/components/AgentSessionProvider";

export default function AgentPage() {
  const agent = useAgent();

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
      />
    </main>
  );
}
