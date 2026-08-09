import { NextRequest, NextResponse } from "next/server";
import { getListing } from "@/lib/listings";
import {
  attachTxToBooking,
  isRangeFree,
  stayTotalUsdc,
  validateStayRange,
} from "@/lib/bookings";
import {
  getSessionPaidFetch,
  readPaymentResponse,
} from "@/lib/agent-payer";
import { assertAgentIsHumanBacked } from "@/lib/agentbook";
import { canAutoPay, getAutoPayLimit } from "@/lib/agent-limits";
import { consumeApprovalToken } from "@/lib/human-approval";
import { uploadReservationReceipt } from "@/lib/og-storage";

export const runtime = "nodejs";

/**
 * Current session's agent pays the x402-protected buy endpoint with its CDP
 * wallet, for a specific date range (checkIn → checkOut, checkout exclusive).
 *
 * Gates (payer only; the host/marketplace receiver is not verified):
 * 1) Agent created for this session
 * 2) AgentBook human-backed
 * 3) Stay total (noches × precio) <= auto-pay limit OR valid one-time World
 *    HITL approvalToken bound to this listing + amount
 * 4) After pay → best-effort 0G receipt upload + tx attached to the booking
 */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    listingId?: string;
    checkIn?: string;
    checkOut?: string;
    approvalToken?: string;
  };
  const listingId = body.listingId?.trim();
  const approvalToken = body.approvalToken?.trim();

  if (!listingId) {
    return NextResponse.json({ error: "listingId is required" }, { status: 400 });
  }

  const listing = await getListing(listingId);
  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  const stay = validateStayRange(body.checkIn?.trim(), body.checkOut?.trim());
  if (!stay.ok) {
    return NextResponse.json(
      { ok: false, code: "INVALID_DATES", error: stay.error },
      { status: 400 },
    );
  }
  if (!(await isRangeFree(listingId, stay))) {
    return NextResponse.json(
      {
        ok: false,
        code: "DATES_TAKEN",
        error: "Esas fechas ya están reservadas. Elegí otras en el calendario.",
      },
      { status: 409 },
    );
  }

  const totalUsdc = stayTotalUsdc(listing.pricePerNight, stay.nights);

  try {
    let session;
    try {
      session = await getSessionPaidFetch();
    } catch (err) {
      const code =
        err && typeof err === "object" && "code" in err
          ? String((err as { code?: string }).code)
          : undefined;
      if (code === "AGENT_NOT_CREATED") {
        return NextResponse.json(
          {
            ok: false,
            code: "AGENT_NOT_CREATED",
            error: "Creá tu agente en Configurar antes de pagar.",
          },
          { status: 403 },
        );
      }
      throw err;
    }

    const { address: agentAddress, paidFetch: fetchWithPayment } = session;

    // Gate only the payer (agent). Receiver/marketplace needs no World check.
    let agentBook;
    try {
      agentBook = await assertAgentIsHumanBacked(agentAddress);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Agent not human-backed";
      return NextResponse.json(
        {
          ok: false,
          code: "AGENT_NOT_HUMAN_BACKED",
          error: message,
          agentAddress,
          registerHint: "Use Configurar → Registrar con World App (QR / deep link).",
          hint: "Register the AGENT wallet with World App, then retry. Marketplace receiver is not verified.",
        },
        { status: 403 },
      );
    }

    const limits = await getAutoPayLimit(agentAddress);
    let usedHumanApproval = false;
    if (!canAutoPay(totalUsdc, limits.autoPayLimitUsdc)) {
      if (!approvalToken) {
        return NextResponse.json(
          {
            ok: false,
            code: "NEEDS_HUMAN_APPROVAL",
            error: `Total $${totalUsdc} USDC (${stay.nights} noche/s) supera el tope automático de $${limits.autoPayLimitUsdc} USDC.`,
            agentAddress,
            limits,
            listing: {
              id: listing.id,
              title: listing.title,
              amountUsdc: totalUsdc,
              checkIn: stay.checkIn,
              checkOut: stay.checkOut,
              nights: stay.nights,
            },
            hint: "Approve this spend with World App (HITL), or raise the auto-pay tope in Configurar.",
          },
          { status: 403 },
        );
      }
      const consumed = await consumeApprovalToken({
        approvalToken,
        agentAddress,
        listingId: listing.id,
        amountUsdc: totalUsdc,
      });
      if (!consumed.ok) {
        return NextResponse.json(
          {
            ok: false,
            code: "NEEDS_HUMAN_APPROVAL",
            error: consumed.error,
            hint: "Start human approval again for this listing.",
            agentAddress,
            limits,
            listing: {
              id: listing.id,
              title: listing.title,
              amountUsdc: totalUsdc,
              checkIn: stay.checkIn,
              checkOut: stay.checkOut,
              nights: stay.nights,
            },
          },
          { status: 403 },
        );
      }
      usedHumanApproval = true;
    }

    const origin = request.nextUrl.origin;
    const buyParams = new URLSearchParams({
      checkIn: stay.checkIn,
      checkOut: stay.checkOut,
      agent: agentAddress,
    });
    const buyUrl = `${origin}/api/listings/${listingId}/buy?${buyParams}`;

    const response = await fetchWithPayment(buyUrl, { method: "POST" });
    const paymentMeta = readPaymentResponse(response.headers);

    const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;

    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          status: response.status,
          error: payload.error || "Purchase failed",
          details: payload,
          agentAddress,
          agentBook,
          paymentMeta,
        },
        { status: response.status },
      );
    }

    const txHash = extractTxHash(paymentMeta);
    const reservation =
      payload.reservation && typeof payload.reservation === "object"
        ? (payload.reservation as {
            bookingId?: string;
            reservedAt?: string;
            checkIn?: string;
            checkOut?: string;
            nights?: number;
          })
        : undefined;
    const reservedAt = reservation?.reservedAt
      ? String(reservation.reservedAt)
      : new Date().toISOString();

    if (reservation?.bookingId) {
      await attachTxToBooking(reservation.bookingId, { txHash, usedHumanApproval });
    }

    const ogReceipt = await uploadReservationReceipt({
      reservedAt,
      agentAddress,
      listing: {
        id: listing.id,
        title: listing.title,
        location: listing.location,
        amountUsdc: totalUsdc,
        checkIn: stay.checkIn,
        checkOut: stay.checkOut,
        nights: stay.nights,
      },
      payment: {
        txHash,
        network: "base-sepolia",
        usedHumanApproval,
      },
      world: {
        humanId: agentBook.humanId,
      },
    });

    return NextResponse.json({
      ok: true,
      agentAddress,
      agentBook: {
        registered: agentBook.registered,
        humanId: agentBook.humanId,
      },
      limits,
      usedHumanApproval,
      listing: {
        id: listing.id,
        title: listing.title,
        location: listing.location,
        amountUsdc: totalUsdc,
        pricePerNight: listing.pricePerNight,
      },
      stay: {
        checkIn: stay.checkIn,
        checkOut: stay.checkOut,
        nights: stay.nights,
      },
      reservation: payload.reservation,
      paymentMeta,
      txHash,
      explorerUrl: txHash
        ? `https://sepolia.basescan.org/tx/${txHash}`
        : undefined,
      ogReceipt,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown purchase error";
    return NextResponse.json(
      {
        ok: false,
        error: message,
        hint: "Check CDP keys, agent wallet USDC on Base Sepolia, and MARKETPLACE_WALLET_ADDRESS.",
      },
      { status: 500 },
    );
  }
}

function extractTxHash(paymentMeta: unknown): string | undefined {
  if (!paymentMeta || typeof paymentMeta !== "object") return undefined;
  const obj = paymentMeta as Record<string, unknown>;
  const candidates = [
    obj.transaction,
    obj.txHash,
    obj.hash,
    (obj as { transactionHash?: string }).transactionHash,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.startsWith("0x")) return c;
  }
  // nested settle response shapes vary by facilitator version
  const settle = obj.settle || obj.payment;
  if (settle && typeof settle === "object") {
    return extractTxHash(settle);
  }
  return undefined;
}
