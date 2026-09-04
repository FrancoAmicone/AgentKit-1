import { HomeExplorer } from "@/components/HomeExplorer";
import { getAllListings } from "@/lib/listings";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const listings = await getAllListings();
  const initialCatalog = listings.map((listing) => ({
    id: listing.id,
    title: listing.title,
    location: listing.location,
    pricePerNight: listing.pricePerNight,
    amenities: listing.amenities,
    rating: listing.rating,
    imageUrl: listing.imageUrl,
    source: listing.source,
  }));

  return <HomeExplorer initialCatalog={initialCatalog} />;
}
