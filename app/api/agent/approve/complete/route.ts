import { NextRequest, NextResponse } from "next/server";
import { getAgentWalletAddress } from "@/lib/agent-payer";
import { completeApprovalSession } from "@/lib/human-approval";
import type { WorldIdProofResult } from "@/lib/agentbook-register";

export const runtime = "nodejs";

type Body = {
  sessionId?: string;
  proof?: WorldIdProofResult;
};

/**
 * Phase 2C: after World App verification, mint a one-time purchase approval token.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;
    if (!body.sessionId) {
      return NextResponse.json(
        { ok: false, error: "sessionId is required" },
        { status: 400 },
      );
    }
    if (!body.proof?.nullifier_hash || !body.proof?.proof || !body.proof?.merkle_root) {
      return NextResponse.json(
        { ok: false, error: "World ID proof is required" },
        { status: 400 },
      );
    }

    const agentAddress = await getAgentWalletAddress();
    const { session, approvalToken } = await completeApprovalSession({
      sessionId: body.sessionId,
      agentAddress,
      proof: body.proof,
    });

    return NextResponse.json({
      ok: true,
      approvalToken,
      sessionId: session.sessionId,
      listingId: session.listingId,
      amountUsdc: session.amountUsdc,
      expiresAt: session.expiresAt,
      hint: "Retry purchase with this approvalToken — one use only.",
    });
  } catch (err) {
    console.error("[approve/complete]", err);
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Approval failed",
      },
      { status: 400 },
    );
  }
}
