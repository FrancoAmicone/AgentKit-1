import { createAgentBookVerifier } from "@worldcoin/agentkit";
import { isAddress } from "viem";

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
 * Whether hosts must World-verify their payout wallet before publishing.
 * Default: true. Set REQUIRE_HUMAN_BACKED_HOST=false to bypass temporarily.
 */
export function isHumanBackedHostRequired(): boolean {
  const raw = process.env.REQUIRE_HUMAN_BACKED_HOST;
  if (raw === undefined || raw === "") return true;
  return !["0", "false", "no", "off"].includes(raw.toLowerCase());
}

/**
 * Look up a wallet in World AgentBook (buyer agent or host payout).
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

/** AgentBook status for a host payout wallet (required flag uses host env). */
export async function getHostBookStatus(payoutAddress: string): Promise<AgentBookStatus> {
  const humanId = await getVerifier().lookupHuman(payoutAddress);
  return {
    address: payoutAddress,
    registered: Boolean(humanId),
    humanId,
    required: isHumanBackedHostRequired(),
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

/**
 * Gate host publish / host-sourced payTo: payout wallet must be in AgentBook
 * when REQUIRE_HUMAN_BACKED_HOST is on (default).
 */
export async function assertHostPayoutIsHumanBacked(payoutAddress: string): Promise<
  | { ok: true; status: AgentBookStatus; skipped?: false }
  | { ok: true; skipped: true }
  | { ok: false; error: string; status?: AgentBookStatus; code?: string }
> {
  if (!isHumanBackedHostRequired()) {
    return { ok: true, skipped: true };
  }

  if (!isAddress(payoutAddress)) {
    return {
      ok: false,
      error: "Host payout wallet is invalid.",
      code: "HOST_WALLET_INVALID",
    };
  }

  const status = await getHostBookStatus(payoutAddress);
  if (!status.registered) {
    return {
      ok: false,
      error:
        "Tu wallet de cobro debe estar verificada con World (AgentBook) antes de publicar.",
      status,
      code: "HOST_NOT_HUMAN_BACKED",
    };
  }
  return { ok: true, status };
}
