import { NextRequest, NextResponse } from "next/server";
import { getListing } from "@/lib/listings";
import {
  isRangeFree,
  stayTotalUsdc,
  stayWithinAvailability,
  validateStayRange,
} from "@/lib/bookings";
import { getSessionAccountName } from "@/lib/agent-session";
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
 * The approval is bound to listing + stay total (noches × precio).
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      listingId?: string;
      checkIn?: string;
      checkOut?: string;
    };
    const listingId = body.listingId?.trim();
    if (!listingId) {
      return NextResponse.json(
        { ok: false, error: "listingId is required" },
        { status: 400 },
      );
    }

    const listing = await getListing(listingId);
    if (!listing) {
      return NextResponse.json(
        { ok: false, error: "Listing not found" },
        { status: 404 },
      );
    }

    const stay = validateStayRange(body.checkIn?.trim(), body.checkOut?.trim());
    if (!stay.ok) {
      return NextResponse.json(
        { ok: false, code: "INVALID_DATES", error: stay.error },
        { status: 400 },
      );
    }
    if (
      !stayWithinAvailability(listing.availabilityWindows, stay) ||
      !(await isRangeFree(listingId, stay))
    ) {
      return NextResponse.json(
        {
          ok: false,
          code: "DATES_TAKEN",
          error: "Esas fechas no están disponibles para este alojamiento.",
        },
        { status: 409 },
      );
    }

    const totalUsdc = stayTotalUsdc(listing.pricePerNight, stay.nights);

    const accountName = await getSessionAccountName();
    if (!accountName) {
      return NextResponse.json(
        {
          ok: false,
          code: "AGENT_NOT_CREATED",
          error: "Creá tu agente antes de pedir aprobación humana.",
        },
        { status: 403 },
      );
    }

    const agentAddress = await getAgentWalletAddress(accountName);
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
    if (canAutoPay(totalUsdc, limits.autoPayLimitUsdc)) {
      return NextResponse.json({
        ok: true,
        approvalNeeded: false,
        message: "Amount is within auto-pay limit — purchase directly.",
        limits,
        listing: {
          id: listing.id,
          title: listing.title,
          amountUsdc: totalUsdc,
        },
        stay,
      });
    }

    const session = await createApprovalSession({
      agentAddress,
      listingId: listing.id,
      amountUsdc: totalUsdc,
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
      actionDescription: `Aprobar pago StayAgent: ${listing.title} · ${stay.nights} noche/s · $${totalUsdc} USDC`,
      limits,
      listing: {
        id: listing.id,
        title: listing.title,
        location: listing.location,
        amountUsdc: totalUsdc,
      },
      stay,
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
