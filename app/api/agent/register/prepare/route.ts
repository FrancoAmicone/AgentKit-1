import { NextResponse } from "next/server";
import { getSessionAccountName } from "@/lib/agent-session";
import { getAgentWalletAddress } from "@/lib/agent-payer";
import { getAgentBookStatus } from "@/lib/agentbook";
import {
  AGENTBOOK_ACTION,
  AGENTBOOK_APP_ID,
  getAgentBookNextNonce,
} from "@/lib/agentbook-register";

/**
 * Prepare AgentBook registration for the current session's agent wallet.
 * Client then opens World App (mobile) or shows QR (desktop) via IDKit bridge.
 */
export async function GET() {
  try {
    const accountName = await getSessionAccountName();
    if (!accountName) {
      return NextResponse.json(
        {
          ok: false,
          code: "AGENT_NOT_CREATED",
          error: "Creá tu agente antes de registrarlo en World.",
        },
        { status: 403 },
      );
    }
    const agentAddress = (await getAgentWalletAddress(
      accountName,
    )) as `0x${string}`;
    const status = await getAgentBookStatus(agentAddress);

    if (status.registered) {
      return NextResponse.json({
        ok: true,
        alreadyRegistered: true,
        agentAddress,
        humanId: status.humanId,
        appId: AGENTBOOK_APP_ID,
        action: AGENTBOOK_ACTION,
      });
    }

    const nonce = await getAgentBookNextNonce(agentAddress);

    return NextResponse.json({
      ok: true,
      alreadyRegistered: false,
      agentAddress,
      nonce: nonce.toString(),
      appId: AGENTBOOK_APP_ID,
      action: AGENTBOOK_ACTION,
      /** Signal types/values for solidityEncode on the client */
      signal: {
        types: ["address", "uint256"],
        values: [agentAddress, nonce.toString()],
      },
      actionDescription: "Register StayAgent payer wallet in AgentBook",
    });
  } catch (err) {
    console.error("[register/prepare]", err);
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Failed to prepare registration",
      },
      { status: 500 },
    );
  }
}
