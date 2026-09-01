import { NextRequest, NextResponse } from "next/server";
import { getHostId } from "@/lib/host-session";
import { getHostProfile } from "@/lib/host-profile";
import { getHostBookStatus } from "@/lib/agentbook";
import {
  buildRegistrationPayload,
  submitAgentBookRegistration,
  type WorldIdProofResult,
} from "@/lib/agentbook-register";
import { isEvmAddress } from "@/lib/host-listings";

export const runtime = "nodejs";

type Body = {
  nonce?: string;
  proof?: WorldIdProofResult;
};

/**
 * After World ID in the browser, submit AgentBook.register for the host
 * payout wallet via the hosted relay (same path as the buyer agent).
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;
    const hostId = await getHostId();
    if (!hostId) {
      return NextResponse.json(
        {
          ok: false,
          code: "HOST_NOT_CREATED",
          error: "No hay sesión de anfitrión en este navegador.",
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
          error: "Registrá tu wallet de cobro antes de verificar con World.",
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
        registered: true,
      });
    }

    if (!body.nonce || !/^\d+$/.test(body.nonce)) {
      return NextResponse.json(
        { ok: false, error: "nonce is required" },
        { status: 400 },
      );
    }
    if (
      !body.proof?.proof ||
      !body.proof.merkle_root ||
      !body.proof.nullifier_hash
    ) {
      return NextResponse.json(
        { ok: false, error: "World ID proof is required" },
        { status: 400 },
      );
    }

    const registration = buildRegistrationPayload(address, body.nonce, body.proof);
    const result = await submitAgentBookRegistration(registration);
    const refreshed = await getHostBookStatus(address);

    return NextResponse.json({
      ok: true,
      alreadyRegistered: false,
      payoutAddress: address,
      agentAddress: address,
      txHash: result.txHash,
      registered: refreshed.registered,
      humanId: refreshed.humanId,
    });
  } catch (err) {
    console.error("[host/register/complete]", err);
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Host registration failed",
      },
      { status: 500 },
    );
  }
}
