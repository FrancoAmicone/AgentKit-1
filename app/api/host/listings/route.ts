import { NextRequest, NextResponse } from "next/server";
import { getHostId, getOrCreateHostId } from "@/lib/host-session";
import {
  createHostListing,
  getHostListingsByHost,
  isEvmAddress,
  type NewHostListingInput,
} from "@/lib/host-listings";
import { getHostProfile } from "@/lib/host-profile";
import { getBookingsForListing } from "@/lib/bookings";
import {
  assertHostPayoutIsHumanBacked,
  getHostBookStatus,
  isHumanBackedHostRequired,
} from "@/lib/agentbook";

export const runtime = "nodejs";

/**
 * Host dashboard data: profile (payout wallet), World/AgentBook status for
 * that wallet, this browser's published listings + bookings, and where each
 * property effectively collects.
 */
export async function GET() {
  const hostId = await getHostId();
  if (!hostId) {
    return NextResponse.json({
      ok: true,
      hostId: null,
      profile: null,
      world: null,
      listings: [],
      hostWorldRequired: isHumanBackedHostRequired(),
    });
  }

  const [listings, profile] = await Promise.all([
    getHostListingsByHost(hostId),
    getHostProfile(hostId),
  ]);

  let world: Awaited<ReturnType<typeof getHostBookStatus>> | null = null;
  if (profile?.payoutAddress && isEvmAddress(profile.payoutAddress)) {
    try {
      world = await getHostBookStatus(profile.payoutAddress);
    } catch (err) {
      console.error("[host/listings] AgentBook lookup failed", err);
    }
  }

  const withBookings = await Promise.all(
    listings.map(async (listing) => {
      const bookings = (await getBookingsForListing(listing.id)).filter(
        (b) => b.source === "onchain",
      );
      const nightsBooked = bookings.reduce((sum, b) => sum + b.nights, 0);
      const totalUsdc = bookings.reduce((sum, b) => sum + b.amountUsdc, 0);
      const payout = listing.payoutAddress
        ? { address: listing.payoutAddress, source: "listing" as const }
        : profile?.payoutAddress
          ? { address: profile.payoutAddress, source: "host" as const }
          : { address: null, source: "marketplace" as const };
      return {
        ...listing,
        bookings,
        bookedRanges: bookings.map(({ checkIn, checkOut }) => ({ checkIn, checkOut })),
        stats: { nightsBooked, totalUsdc: Math.round(totalUsdc * 1e6) / 1e6 },
        payout,
      };
    }),
  );

  return NextResponse.json({
    ok: true,
    hostId,
    profile,
    world,
    hostWorldRequired: isHumanBackedHostRequired(),
    canPublish:
      !isHumanBackedHostRequired() ||
      Boolean(world?.registered && profile?.payoutAddress),
    listings: withBookings,
  });
}

/** Publish a new property for this browser's host session. */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as Partial<NewHostListingInput>;

  try {
    const hostId = await getOrCreateHostId();
    const profile = await getHostProfile(hostId);

    const listingOverride =
      body.payoutAddress && String(body.payoutAddress).trim()
        ? String(body.payoutAddress).trim()
        : undefined;
    const effectivePayTo = listingOverride || profile?.payoutAddress;

    if (isHumanBackedHostRequired()) {
      if (!effectivePayTo || !isEvmAddress(effectivePayTo)) {
        return NextResponse.json(
          {
            ok: false,
            code: "HOST_WALLET_REQUIRED",
            error:
              "Registrá y verificá con World tu wallet de cobro antes de publicar.",
          },
          { status: 403 },
        );
      }
      const gate = await assertHostPayoutIsHumanBacked(effectivePayTo);
      if (!gate.ok) {
        return NextResponse.json(
          {
            ok: false,
            code: gate.code || "HOST_NOT_HUMAN_BACKED",
            error: gate.error,
            world: gate.status ?? null,
          },
          { status: 403 },
        );
      }
    }

    const listing = await createHostListing(hostId, {
      title: String(body.title ?? ""),
      location: String(body.location ?? ""),
      description: String(body.description ?? ""),
      pricePerNight: Number(body.pricePerNight),
      amenities: Array.isArray(body.amenities)
        ? body.amenities.map(String)
        : String(body.amenities ?? "")
            .split(",")
            .map((a) => a.trim())
            .filter(Boolean),
      imageUrl: body.imageUrl ? String(body.imageUrl) : undefined,
      maxGuests: Number(body.maxGuests ?? 2),
      payoutAddress: listingOverride,
      availabilityWindows: body.availabilityWindows,
    });

    return NextResponse.json({
      ok: true,
      listing,
      publicUrl: `/stays/${listing.id}`,
      message: `Publicado: ${listing.title}`,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "No se pudo publicar la propiedad",
      },
      { status: 400 },
    );
  }
}
