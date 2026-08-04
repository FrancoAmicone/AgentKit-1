import { NextResponse } from "next/server";
import { getAgentWalletAddress } from "@/lib/agent-payer";
import { getAgentBookStatus } from "@/lib/agentbook";

export const runtime = "nodejs";

/**
 * Public status of the StayAgent payer wallet in World AgentBook.
 * Does not check the marketplace receiver — only the agent that purchases.
 */
export async function GET() {
  try {
    const address = await getAgentWalletAddress();
    const status = await getAgentBookStatus(address);

    return NextResponse.json({
      ok: true,
      role: "agent-payer",
      ...status,
      registerHint: status.registered
        ? undefined
        : `npx @worldcoin/agentkit-cli register ${address}`,
      note: "Only the purchasing agent must be human-backed. The marketplace receiver is not verified.",
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Failed to resolve agent status",
      },
      { status: 500 },
    );
  }
}
