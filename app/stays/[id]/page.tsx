import type { Metadata } from "next";
import { getListing } from "@/lib/listings";
import { getBookedRanges, validateStayRange } from "@/lib/bookings";
import { StayDetail } from "@/components/StayDetail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ checkIn?: string; checkOut?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListing(id);
  if (!listing) return { title: "Alojamiento — StayAgent" };
  return {
    title: `${listing.title} — StayAgent`,
    description: `${listing.location} · $${listing.pricePerNight} USDC/noche · disponibilidad pública y reserva con agente onchain.`,
  };
}

/**
 * Public listing page. Never hard-404s on SSR: if the store miss happens
 * (cold serverless /tmp race before Runtime Cache), the client re-fetches
 * `/api/listings/[id]` and recovers. See docs/16-host-payto-verification.md.
 */
export default async function StayPage({ params, searchParams }: Props) {
  const { id } = await params;
  const query = await searchParams;
  const listing = await getListing(id);
  const bookedRanges = listing ? await getBookedRanges(id) : [];
  const stay = validateStayRange(query.checkIn, query.checkOut);

  return (
    <StayDetail
      listingId={id}
      listing={listing ?? null}
      initialBookedRanges={bookedRanges}
      initialStay={stay.ok ? { checkIn: stay.checkIn, checkOut: stay.checkOut } : undefined}
    />
  );
}
