import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getListing } from "@/lib/listings";
import { getBookedRanges } from "@/lib/bookings";
import { StayDetail } from "@/components/StayDetail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

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
 * Public listing page: anyone can see the description and which dates are
 * locked; paying a reservation goes through the session's agent.
 */
export default async function StayPage({ params }: Props) {
  const { id } = await params;
  const listing = await getListing(id);
  if (!listing) notFound();

  const bookedRanges = await getBookedRanges(id);

  return <StayDetail listing={listing} initialBookedRanges={bookedRanges} />;
}
