import { NextRequest, NextResponse } from "next/server";
import { getListing } from "@/lib/listings";
import { getAgentWalletAddress } from "@/lib/agent-payer";
import { assertAgentIsHumanBacked } from "@/lib/agentbook";
import { canAutoPay, getAutoPayLimit } from "@/lib/agent-limits";
import {
  approvalFingerprint,
  createApprovalSession,
  HITL_APP_ID,
} from "@/lib/human-approval";

export const runtime = "nodejs";

/**
 * Phase 2C: start a World ID human approval for an over-limit purchase.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as { listingId?: string };
    const listingId = body.listingId?.trim();
    if (!listingId) {
      return NextResponse.json(
        { ok: false, error: "listingId is required" },
        { status: 400 },
      );
    }

    const listing = getListing(listingId);
    if (!listing) {
      return NextResponse.json(
        { ok: false, error: "Listing not found" },
        { status: 404 },
      );
    }
    if (!listing.available) {
      return NextResponse.json(
        { ok: false, error: "Listing already reserved" },
        { status: 409 },
      );
    }

    const agentAddress = await getAgentWalletAddress();
    try {
      await assertAgentIsHumanBacked(agentAddress);
    } catch {
      return NextResponse.json(
        {
          ok: false,
          code: "AGENT_NOT_HUMAN_BACKED",
          error: "Register the agent before requesting human approval.",
        },
        { status: 403 },
      );
    }

    const limits = await getAutoPayLimit(agentAddress);
    if (canAutoPay(listing.pricePerNight, limits.autoPayLimitUsdc)) {
      return NextResponse.json({
        ok: true,
        approvalNeeded: false,
        message: "Amount is within auto-pay limit — purchase directly.",
        limits,
        listing: {
          id: listing.id,
          title: listing.title,
          amountUsdc: listing.pricePerNight,
        },
      });
    }

    const session = await createApprovalSession({
      agentAddress,
      listingId: listing.id,
      amountUsdc: listing.pricePerNight,
      listingTitle: listing.title,
    });

    return NextResponse.json({
      ok: true,
      approvalNeeded: true,
      appId: HITL_APP_ID,
      sessionId: session.sessionId,
      action: session.action,
      signal: session.signal,
      amountMicros: session.amountMicros,
      expiresAt: session.expiresAt,
      fingerprint: approvalFingerprint(session),
      actionDescription: `Aprobar pago StayAgent: ${listing.title} · $${listing.pricePerNight} USDC`,
      limits,
      listing: {
        id: listing.id,
        title: listing.title,
        location: listing.location,
        amountUsdc: listing.pricePerNight,
      },
      agentAddress,
    });
  } catch (err) {
    console.error("[approve/prepare]", err);
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Failed to prepare approval",
      },
      { status: 500 },
    );
  }
}
