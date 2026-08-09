import { NextRequest, NextResponse } from "next/server";
import { getHostId, getOrCreateHostId } from "@/lib/host-session";
import {
  createHostListing,
  getHostListingsByHost,
  type NewHostListingInput,
} from "@/lib/host-listings";
import { getHostProfile } from "@/lib/host-profile";
import { getBookingsForListing } from "@/lib/bookings";

export const runtime = "nodejs";

/**
 * Host dashboard data: profile (payout wallet), this browser's published
 * listings + the bookings (locked dates, amounts, tx hashes) each one
 * received, and where each property effectively collects.
 */
export async function GET() {
  const hostId = await getHostId();
  if (!hostId) {
    return NextResponse.json({ ok: true, hostId: null, profile: null, listings: [] });
  }

  const [listings, profile] = await Promise.all([
    getHostListingsByHost(hostId),
    getHostProfile(hostId),
  ]);
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

  return NextResponse.json({ ok: true, hostId, profile, listings: withBookings });
}

/** Publish a new property for this browser's host session. */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as Partial<NewHostListingInput>;

  try {
    const hostId = await getOrCreateHostId();
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
      payoutAddress: body.payoutAddress ? String(body.payoutAddress) : undefined,
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
