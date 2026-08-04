import { createAgentBookVerifier } from "@worldcoin/agentkit";

export type AgentBookStatus = {
  address: string;
  registered: boolean;
  /** Anonymous human id from AgentBook (hex), if registered */
  humanId: string | null;
  required: boolean;
};

let verifier: ReturnType<typeof createAgentBookVerifier> | null = null;

function getVerifier() {
  if (!verifier) {
    verifier = createAgentBookVerifier();
  }
  return verifier;
}

/**
 * Whether purchase must require a human-backed agent wallet.
 * Default: true (Phase 2). Set REQUIRE_HUMAN_BACKED_AGENT=false to bypass temporarily.
 */
export function isHumanBackedRequired(): boolean {
  const raw = process.env.REQUIRE_HUMAN_BACKED_AGENT;
  if (raw === undefined || raw === "") return true;
  return !["0", "false", "no", "off"].includes(raw.toLowerCase());
}

/**
 * Look up the agent (payer) wallet in World AgentBook.
 * Marketplace / receiver is NOT checked — only the agent that spends.
 */
export async function getAgentBookStatus(address: string): Promise<AgentBookStatus> {
  const humanId = await getVerifier().lookupHuman(address);
  return {
    address,
    registered: Boolean(humanId),
    humanId,
    required: isHumanBackedRequired(),
  };
}

export async function assertAgentIsHumanBacked(address: string): Promise<AgentBookStatus> {
  const status = await getAgentBookStatus(address);
  if (status.required && !status.registered) {
    const err = new Error(
      "Agent wallet is not registered in World AgentBook. Register with: npx @worldcoin/agentkit-cli register " +
        address,
    );
    (err as Error & { code?: string }).code = "AGENT_NOT_HUMAN_BACKED";
    throw err;
  }
  return status;
}
