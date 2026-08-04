import { NextRequest, NextResponse } from "next/server";
import { getAgentWalletAddress } from "@/lib/agent-payer";
import { getAgentBookStatus } from "@/lib/agentbook";
import {
  buildRegistrationPayload,
  submitAgentBookRegistration,
  type WorldIdProofResult,
} from "@/lib/agentbook-register";

type Body = {
  nonce?: string;
  proof?: WorldIdProofResult;
};

/**
 * After World ID verification in the browser, submit AgentBook.register via hosted relay.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;
    const agentAddress = await getAgentWalletAddress();
    const status = await getAgentBookStatus(agentAddress);

    if (status.registered) {
      return NextResponse.json({
        ok: true,
        alreadyRegistered: true,
        agentAddress,
        humanId: status.humanId,
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

    const registration = buildRegistrationPayload(
      agentAddress,
      body.nonce,
      body.proof,
    );
    const result = await submitAgentBookRegistration(registration);
    const refreshed = await getAgentBookStatus(agentAddress);

    return NextResponse.json({
      ok: true,
      alreadyRegistered: false,
      agentAddress,
      txHash: result.txHash,
      registered: refreshed.registered,
      humanId: refreshed.humanId,
    });
  } catch (err) {
    console.error("[register/complete]", err);
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Registration failed",
      },
      { status: 500 },
    );
  }
}
