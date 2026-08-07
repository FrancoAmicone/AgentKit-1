import { NextResponse } from "next/server";
import { getSessionAccountName } from "@/lib/agent-session";
import { getAgentWalletAddress } from "@/lib/agent-payer";
import { getAgentBookStatus } from "@/lib/agentbook";
import { getAutoPayLimit } from "@/lib/agent-limits";
import { getAgentBalances } from "@/lib/agent-balances";

export const runtime = "nodejs";

/**
 * Current user's agent: address, balances, AgentBook, tope.
 */
export async function GET() {
  try {
    const accountName = await getSessionAccountName();
    if (!accountName) {
      return NextResponse.json({
        ok: true,
        hasAgent: false,
        needsCreate: true,
        message: "Creá tu agente para empezar.",
      });
    }

    const address = (await getAgentWalletAddress(accountName)) as `0x${string}`;
    const [status, limits, balances] = await Promise.all([
      getAgentBookStatus(address),
      getAutoPayLimit(address),
      getAgentBalances(address),
    ]);

    const readyToPay =
      Boolean(status.registered || !status.required) && balances.funded;

    return NextResponse.json({
      ok: true,
      hasAgent: true,
      needsCreate: false,
      accountName,
      ...status,
      address,
      limits,
      balances,
      readyToPay,
      fundHint: {
        network: "Base Sepolia",
        asset: "USDC",
        usdcContract: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
        faucetEth: "https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet",
        faucetUsdc: "https://portal.cdp.coinbase.com",
        explorer: `https://sepolia.basescan.org/address/${address}`,
      },
      note: "Solo el agente que compra debe ser human-backed. El marketplace no.",
    });
  } catch (err) {
    console.error("[agent/me]", err);
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Failed to load agent",
      },
      { status: 500 },
    );
  }
}
