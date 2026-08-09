import { NextRequest, NextResponse } from "next/server";
import { getListing } from "@/lib/listings";
import { getBookedRanges, MAX_NIGHTS } from "@/lib/bookings";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Public listing detail + availability: anyone (buyer, host, or another
 * agent) can read which nights are already locked without paying.
 */
export async function GET(_request: NextRequest, context: Ctx) {
  const { id } = await context.params;
  const listing = await getListing(id);

  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  const bookedRanges = await getBookedRanges(id);

  return NextResponse.json({
    listing,
    bookedRanges,
    maxNights: MAX_NIGHTS,
  });
}
