import { NextResponse } from "next/server";
import { getCdpClient } from "@/lib/cdp";
import {
  getSessionAccountName,
  makeAgentAccountName,
  setSessionAccountName,
} from "@/lib/agent-session";
import { getAgentBalances } from "@/lib/agent-balances";

export const runtime = "nodejs";

/**
 * Create (or return) a dedicated CDP agent wallet for this browser session.
 * Sets an httpOnly cookie with the CDP account name.
 */
export async function POST() {
  try {
    const existing = await getSessionAccountName();
    const cdp = getCdpClient();

    if (existing) {
      const account = await cdp.evm.getOrCreateAccount({ name: existing });
      const balances = await getAgentBalances(account.address as `0x${string}`);
      return NextResponse.json({
        ok: true,
        created: false,
        accountName: existing,
        address: account.address,
        balances,
        message: "Ya tenés un agente en esta sesión.",
      });
    }

    const accountName = makeAgentAccountName();
    const account = await cdp.evm.getOrCreateAccount({ name: accountName });
    await setSessionAccountName(accountName);

    // Best-effort faucet (rate-limited) so demos can start faster.
    try {
      await cdp.evm.requestFaucet({
        address: account.address,
        network: "base-sepolia",
        token: "eth",
      });
    } catch {
      // ignore
    }
    try {
      await cdp.evm.requestFaucet({
        address: account.address,
        network: "base-sepolia",
        token: "usdc",
      });
    } catch {
      // ignore — user can fund manually
    }

    const balances = await getAgentBalances(account.address as `0x${string}`);

    return NextResponse.json({
      ok: true,
      created: true,
      accountName,
      address: account.address,
      balances,
      message:
        "Agente creado. Cargá USDC (Base Sepolia) en esta address si el faucet no alcanzó.",
    });
  } catch (err) {
    console.error("[agent/create]", err);
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Failed to create agent",
      },
      { status: 500 },
    );
  }
}
