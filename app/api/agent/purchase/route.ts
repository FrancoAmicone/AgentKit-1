import { NextRequest, NextResponse } from "next/server";
import { getListing } from "@/lib/listings";
import { getAgentWalletAddress, getPaidFetch, readPaymentResponse } from "@/lib/agent-payer";

export const runtime = "nodejs";

/**
 * Agent pays the x402-protected buy endpoint with its CDP wallet.
 */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as { listingId?: string };
  const listingId = body.listingId?.trim();

  if (!listingId) {
    return NextResponse.json({ error: "listingId is required" }, { status: 400 });
  }

  const listing = getListing(listingId);
  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }
  if (!listing.available) {
    return NextResponse.json({ error: "Listing already reserved" }, { status: 409 });
  }

  try {
    const agentAddress = await getAgentWalletAddress();
    const origin = request.nextUrl.origin;
    const buyUrl = `${origin}/api/listings/${listingId}/buy`;

    const fetchWithPayment = getPaidFetch();
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
          paymentMeta,
        },
        { status: response.status },
      );
    }

    const txHash = extractTxHash(paymentMeta);

    return NextResponse.json({
      ok: true,
      agentAddress,
      listing: {
        id: listing.id,
        title: listing.title,
        location: listing.location,
        amountUsdc: listing.pricePerNight,
      },
      reservation: payload.reservation,
      paymentMeta,
      txHash,
      explorerUrl: txHash
        ? `https://sepolia.basescan.org/tx/${txHash}`
        : undefined,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown purchase error";
    return NextResponse.json(
      {
        ok: false,
        error: message,
        hint: "Check CDP keys, AGENT wallet USDC on Base Sepolia, and MARKETPLACE_WALLET_ADDRESS.",
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
