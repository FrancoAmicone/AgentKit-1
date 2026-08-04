import { NextRequest, NextResponse } from "next/server";
import { filterListings, getAllListings } from "@/lib/listings";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const destino = searchParams.get("destino") || undefined;
  const precioMaxRaw = searchParams.get("precioMax");
  const amenitiesRaw = searchParams.get("amenities");

  const precioMax = precioMaxRaw ? Number(precioMaxRaw) : undefined;
  const amenities = amenitiesRaw
    ? amenitiesRaw.split(",").map((a) => a.trim()).filter(Boolean)
    : undefined;

  const hasFilters = Boolean(destino || precioMax || amenities?.length);
  const listings = hasFilters
    ? filterListings({ destino, precioMax, amenities })
    : getAllListings().filter((l) => l.available);

  return NextResponse.json({ listings, count: listings.length });
}
