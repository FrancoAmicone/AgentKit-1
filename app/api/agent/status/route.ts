import { NextResponse } from "next/server";
import { getSessionAccountName } from "@/lib/agent-session";
import { getAgentWalletAddress } from "@/lib/agent-payer";
import { getAgentBookStatus } from "@/lib/agentbook";

export const runtime = "nodejs";

/**
 * Status of the current session's agent wallet in World AgentBook.
 */
export async function GET() {
  try {
    const accountName = await getSessionAccountName();
    if (!accountName) {
      return NextResponse.json({
        ok: true,
        hasAgent: false,
        needsCreate: true,
        registered: false,
        required: true,
        note: "Creá tu agente en Configurar para continuar.",
      });
    }

    const address = await getAgentWalletAddress(accountName);
    const status = await getAgentBookStatus(address);

    return NextResponse.json({
      ok: true,
      hasAgent: true,
      needsCreate: false,
      accountName,
      role: "agent-payer",
      ...status,
      registerHint: status.registered
        ? undefined
        : "Usá Configurar → Registrar con World App",
      note: "Only the purchasing agent must be human-backed. The marketplace receiver is not verified.",
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error ? err.message : "Failed to resolve agent status",
      },
      { status: 500 },
    );
  }
}
