import { NextRequest, NextResponse } from "next/server";
import { withX402 } from "@x402/next";
import { getListing, reserveListing } from "@/lib/listings";
import {
  BASE_SEPOLIA,
  getMarketplacePayTo,
  getX402ResourceServer,
  shouldSyncFacilitator,
} from "@/lib/x402-server";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

/**
 * x402-protected buy endpoint.
 * Without a valid payment → 402 with price = listing.pricePerNight USDC.
 * With payment → marks listing reserved and returns confirmation.
 */
export async function POST(request: NextRequest, context: Ctx) {
  const { id } = await context.params;
  const listing = getListing(id);

  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }
  if (!listing.available) {
    return NextResponse.json({ error: "Listing already reserved" }, { status: 409 });
  }

  let payTo: `0x${string}`;
  try {
    payTo = getMarketplacePayTo();
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Marketplace wallet not configured" },
      { status: 500 },
    );
  }

  const server = await getX402ResourceServer();

  const handler = async (_request: NextRequest): Promise<NextResponse> => {
    const reserved = reserveListing(id);
    if (!reserved) {
      return NextResponse.json({ error: "Listing no longer available" }, { status: 409 });
    }

    return NextResponse.json({
      ok: true,
      reservation: {
        listingId: reserved.id,
        title: reserved.title,
        location: reserved.location,
        amountUsdc: reserved.pricePerNight,
        payTo: reserved.ownerWalletAddress,
        reservedAt: new Date().toISOString(),
      },
      message: `Reservado: ${reserved.title}`,
    });
  };

  return withX402(
    handler,
    {
      accepts: {
        scheme: "exact",
        price: `$${listing.pricePerNight}`,
        network: BASE_SEPOLIA,
        payTo,
      },
      description: `Reserve stay: ${listing.title}`,
      mimeType: "application/json",
    },
    server,
    undefined,
    undefined,
    shouldSyncFacilitator(),
  )(request);
}
