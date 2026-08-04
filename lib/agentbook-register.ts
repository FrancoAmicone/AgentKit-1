import { createPublicClient, decodeAbiParameters, http } from "viem";
import { worldchain } from "viem/chains";

/** Canonical AgentBook contract used by @worldcoin/agentkit-cli */
export const AGENT_BOOK_CONTRACT =
  "0xA23aB2712eA7BBa896930544C7d6636a96b944dA" as const;

/** World ID app + action used by the official AgentBook CLI registration flow */
export const AGENTBOOK_APP_ID =
  "app_a7c3e2b6b83927251a0db5345bd7146a" as const;
export const AGENTBOOK_ACTION = "agentbook-registration";

export const AGENTBOOK_RELAY_URL =
  process.env.AGENTBOOK_RELAY_URL?.replace(/\/$/, "") ||
  "https://x402-worldchain.vercel.app";

const AGENT_BOOK_ABI = [
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "getNextNonce",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export type WorldIdProofResult = {
  proof: string;
  merkle_root: string;
  nullifier_hash: string;
  verification_level?: string;
};

export type AgentBookRegistrationPayload = {
  agent: string;
  root: string;
  nonce: string;
  nullifierHash: string;
  proof: string[];
  contract: string;
};

function getWorldClient() {
  return createPublicClient({
    chain: worldchain,
    transport: http(),
  });
}

export async function getAgentBookNextNonce(agentAddress: `0x${string}`): Promise<bigint> {
  const client = getWorldClient();
  return client.readContract({
    address: AGENT_BOOK_CONTRACT,
    abi: AGENT_BOOK_ABI,
    functionName: "getNextNonce",
    args: [agentAddress],
  });
}

export function normalizeWorldIdProof(result: WorldIdProofResult): string[] | null {
  const rawProof = result.proof;
  if (rawProof.startsWith("[")) {
    try {
      const parsed = JSON.parse(rawProof) as unknown;
      if (Array.isArray(parsed) && parsed.every((v) => typeof v === "string")) {
        return parsed as string[];
      }
    } catch {
      // fall through to ABI decode
    }
  }
  try {
    const decoded = decodeAbiParameters([{ type: "uint256[8]" }], rawProof as `0x${string}`)[0];
    return decoded.map((v) => `0x${v.toString(16).padStart(64, "0")}`);
  } catch {
    return null;
  }
}

export function buildRegistrationPayload(
  agentAddress: string,
  nonce: string | bigint,
  proofResult: WorldIdProofResult,
): AgentBookRegistrationPayload {
  const proof = normalizeWorldIdProof(proofResult);
  if (!proof) {
    throw new Error("Unexpected proof format returned by World ID");
  }
  return {
    agent: agentAddress,
    root: proofResult.merkle_root,
    nonce: nonce.toString(),
    nullifierHash: proofResult.nullifier_hash,
    proof,
    contract: AGENT_BOOK_CONTRACT,
  };
}

export async function submitAgentBookRegistration(
  registration: AgentBookRegistrationPayload,
): Promise<{ txHash?: string }> {
  const response = await fetch(`${AGENTBOOK_RELAY_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(registration),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`AgentBook relay failed (${response.status}): ${body}`);
  }
  return (await response.json()) as { txHash?: string };
}
