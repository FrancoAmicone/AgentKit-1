import { NextRequest, NextResponse } from "next/server";
import { withX402 } from "@x402/next";
import { getListing } from "@/lib/listings";
import {
  createBooking,
  isRangeFree,
  stayTotalUsdc,
  validateStayRange,
} from "@/lib/bookings";
import { isEvmAddress } from "@/lib/host-listings";
import {
  BASE_SEPOLIA,
  getMarketplacePayTo,
  getX402ResourceServer,
  shouldSyncFacilitator,
} from "@/lib/x402-server";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

/**
 * x402-protected buy endpoint for a date range.
 *
 * Query params: checkIn / checkOut (YYYY-MM-DD, checkout exclusive) and an
 * optional `agent` address recorded on the booking for the host dashboard.
 *
 * Without a valid payment → 402 with price = pricePerNight × nights USDC.
 * With payment → locks those nights (booking) and returns the reservation.
 * payTo = host payout wallet for host listings, marketplace wallet for seed.
 */
export async function POST(request: NextRequest, context: Ctx) {
  const { id } = await context.params;
  const listing = await getListing(id);

  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  const { searchParams } = request.nextUrl;
  const stay = validateStayRange(
    searchParams.get("checkIn") ?? undefined,
    searchParams.get("checkOut") ?? undefined,
  );
  if (!stay.ok) {
    return NextResponse.json({ error: stay.error }, { status: 400 });
  }

  if (!(await isRangeFree(id, stay))) {
    return NextResponse.json(
      { error: "Esas fechas ya están reservadas para este alojamiento." },
      { status: 409 },
    );
  }

  const guestAgentRaw = searchParams.get("agent") ?? undefined;
  const guestAgentAddress =
    guestAgentRaw && isEvmAddress(guestAgentRaw) ? guestAgentRaw : undefined;

  let payTo: `0x${string}`;
  try {
    payTo = isEvmAddress(listing.ownerWalletAddress)
      ? (listing.ownerWalletAddress as `0x${string}`)
      : getMarketplacePayTo();
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Marketplace wallet not configured" },
      { status: 500 },
    );
  }

  const totalUsdc = stayTotalUsdc(listing.pricePerNight, stay.nights);
  const server = await getX402ResourceServer();

  const handler = async (_request: NextRequest): Promise<NextResponse> => {
    const booking = await createBooking({
      listingId: id,
      checkIn: stay.checkIn,
      checkOut: stay.checkOut,
      amountUsdc: totalUsdc,
      guestAgentAddress,
    });
    if (!booking) {
      return NextResponse.json(
        { error: "Esas fechas se reservaron mientras se procesaba el pago." },
        { status: 409 },
      );
    }

    return NextResponse.json({
      ok: true,
      reservation: {
        bookingId: booking.id,
        listingId: listing.id,
        title: listing.title,
        location: listing.location,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        nights: booking.nights,
        amountUsdc: totalUsdc,
        payTo,
        reservedAt: booking.createdAt,
      },
      message: `Reservado: ${listing.title} · ${booking.nights} noche(s)`,
    });
  };

  return withX402(
    handler,
    {
      accepts: {
        scheme: "exact",
        price: `$${totalUsdc}`,
        network: BASE_SEPOLIA,
        payTo,
      },
      description: `Reserve stay: ${listing.title} (${stay.checkIn} → ${stay.checkOut}, ${stay.nights} noches)`,
      mimeType: "application/json",
    },
    server,
    undefined,
    undefined,
    shouldSyncFacilitator(),
  )(request);
}
