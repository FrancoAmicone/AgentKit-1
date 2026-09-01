import { NextRequest, NextResponse } from "next/server";
import { withX402 } from "@x402/next";
import { getListing, resolveListingPayTo } from "@/lib/listings";
import {
  createBooking,
  isRangeFree,
  stayTotalUsdc,
  stayWithinAvailability,
  validateStayRange,
} from "@/lib/bookings";
import { isEvmAddress } from "@/lib/host-listings";
import { assertHostPayoutIsHumanBacked } from "@/lib/agentbook";
import {
  BASE_SEPOLIA,
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
 * payTo = resolved host/marketplace wallet (see resolveListingPayTo).
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

  if (!stayWithinAvailability(listing.availabilityWindows, stay)) {
    return NextResponse.json(
      { error: "El anfitrión no ofrece este alojamiento en esas fechas." },
      { status: 409 },
    );
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

  const payout = await resolveListingPayTo(listing);
  const payTo = payout.address as `0x${string}`;
  if (!payout.isEvm) {
    return NextResponse.json(
      {
        error:
          "No hay wallet de cobro válida. El anfitrión debe registrar su wallet, o configurá MARKETPLACE_WALLET_ADDRESS.",
      },
      { status: 500 },
    );
  }

  // Host / listing payTo must stay World-verified (marketplace fallback is exempt).
  if (payout.source === "host" || payout.source === "listing") {
    const gate = await assertHostPayoutIsHumanBacked(payTo);
    if (!gate.ok) {
      return NextResponse.json(
        {
          error:
            gate.error ||
            "La wallet de cobro del anfitrión no está verificada con World.",
          code: gate.code || "HOST_NOT_HUMAN_BACKED",
        },
        { status: 403 },
      );
    }
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
        payoutSource: payout.source,
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
