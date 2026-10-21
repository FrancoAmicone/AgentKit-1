import { NextRequest, NextResponse } from "next/server";
import { filterListings } from "@/lib/listings";
import { parseSearchQuery } from "@/lib/nlp";
import { isDateStr } from "@/lib/dates";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    query?: string;
    checkIn?: string;
    checkOut?: string;
  };
  const query = body.query?.trim() || "";

  const { filters, explanation, source } = await parseSearchQuery(query);
  if (isDateStr(body.checkIn) && isDateStr(body.checkOut)) {
    filters.checkIn = body.checkIn;
    filters.checkOut = body.checkOut;
  }
  const listings = (await filterListings(filters)).sort((a, b) => b.rating - a.rating);

  const results = listings.map((l) => ({
    ...l,
    matchReason: buildMatchReason(l, filters),
  }));

  return NextResponse.json({
    query,
    filters,
    explanation,
    parser: source,
    results,
    count: results.length,
  });
}

function buildMatchReason(
  listing: { location: string; pricePerNight: number; amenities: string[] },
  filters: {
    destino?: string;
    precioMax?: number;
    amenities?: string[];
    checkIn?: string;
    checkOut?: string;
  },
): string {
  const bits: string[] = [];
  if (filters.destino) bits.push(`queda en ${listing.location}`);
  if (filters.precioMax) bits.push(`$${listing.pricePerNight}/noche dentro de tu tope`);
  if (filters.amenities?.length) {
    const hit = listing.amenities.filter((a) =>
      filters.amenities!.some((f) => a.toLowerCase().includes(f.toLowerCase())),
    );
    if (hit.length) bits.push(`tiene ${hit.join(", ")}`);
  }
  if (filters.checkIn && filters.checkOut) bits.push("libre en esas fechas");
  if (!bits.length) bits.push("opción disponible");
  return bits.join(" · ");
}
