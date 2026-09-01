import { NextResponse } from "next/server";
import { getHostId } from "@/lib/host-session";
import { getHostProfile } from "@/lib/host-profile";
import { getHostBookStatus } from "@/lib/agentbook";
import {
  AGENTBOOK_ACTION,
  AGENTBOOK_APP_ID,
  getAgentBookNextNonce,
} from "@/lib/agentbook-register";
import { isEvmAddress } from "@/lib/host-listings";

export const runtime = "nodejs";

/**
 * Prepare AgentBook registration for the host's payout wallet.
 * Same World App / AgentBook flow as the buyer agent, but the address is
 * the host's cobro wallet (not a CDP session agent).
 */
export async function GET() {
  try {
    const hostId = await getHostId();
    if (!hostId) {
      return NextResponse.json(
        {
          ok: false,
          code: "HOST_NOT_CREATED",
          error: "Abrí Modo anfitrión y registrá tu wallet de cobro primero.",
        },
        { status: 403 },
      );
    }

    const profile = await getHostProfile(hostId);
    const payoutAddress = profile?.payoutAddress?.trim();
    if (!payoutAddress || !isEvmAddress(payoutAddress)) {
      return NextResponse.json(
        {
          ok: false,
          code: "HOST_WALLET_REQUIRED",
          error:
            "Primero registrá tu wallet de cobro (0x…), después verificála con World.",
        },
        { status: 400 },
      );
    }

    const address = payoutAddress as `0x${string}`;
    const status = await getHostBookStatus(address);

    if (status.registered) {
      return NextResponse.json({
        ok: true,
        alreadyRegistered: true,
        payoutAddress: address,
        agentAddress: address,
        humanId: status.humanId,
        appId: AGENTBOOK_APP_ID,
        action: AGENTBOOK_ACTION,
        required: status.required,
      });
    }

    const nonce = await getAgentBookNextNonce(address);

    return NextResponse.json({
      ok: true,
      alreadyRegistered: false,
      payoutAddress: address,
      agentAddress: address,
      nonce: nonce.toString(),
      appId: AGENTBOOK_APP_ID,
      action: AGENTBOOK_ACTION,
      signal: {
        types: ["address", "uint256"],
        values: [address, nonce.toString()],
      },
      actionDescription: "Register StayAgent host payout wallet in AgentBook",
      required: status.required,
    });
  } catch (err) {
    console.error("[host/register/prepare]", err);
    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error ? err.message : "Failed to prepare host registration",
      },
      { status: 500 },
    );
  }
}
