export type Listing = {
  id: string;
  title: string;
  location: string;
  pricePerNight: number;
  amenities: string[];
  rating: number;
  imageUrl: string;
  available: boolean;
  ownerWalletAddress: string;
};

/**
 * Mock catalog for Phase 1.
 * ownerWalletAddress is overwritten at runtime with MARKETPLACE_WALLET_ADDRESS
 * when that env var is set (see lib/listings.ts).
 */
export const LISTINGS_SEED: Listing[] = [
  {
    id: "bariloche-cabin",
    title: "Cabaña con pileta en Bariloche",
    location: "Bariloche, Río Negro",
    pricePerNight: 0.05,
    amenities: ["pileta", "wifi", "cochera", "parrilla"],
    rating: 4.7,
    imageUrl: "https://images.unsplash.com/photo-1518780664697-55e0ad1cb9a4?w=800&q=80",
    available: true,
    ownerWalletAddress: "0x0000000000000000000000000000000000000001",
  },
  {
    id: "mendoza-vineyard",
    title: "Casa entre viñedos",
    location: "Mendoza, Mendoza",
    // Above the $1 minimum auto-pay floor — useful to test NEEDS_HUMAN_APPROVAL
    pricePerNight: 2,
    amenities: ["wifi", "estacionamiento", "desayuno"],
    rating: 4.8,
    imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
    available: true,
    ownerWalletAddress: "0x0000000000000000000000000000000000000001",
  },
  {
    id: "ushuaia-loft",
    title: "Loft frente al canal",
    location: "Ushuaia, Tierra del Fuego",
    pricePerNight: 0.05,
    amenities: ["wifi", "calefaccion", "vista"],
    rating: 4.5,
    imageUrl: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80",
    available: true,
    ownerWalletAddress: "0x0000000000000000000000000000000000000001",
  },
  {
    id: "salta-adobe",
    title: "Adobe con patio",
    location: "Salta, Salta",
    pricePerNight: 0.05,
    amenities: ["wifi", "patio", "cochera"],
    rating: 4.4,
    imageUrl: "https://images.unsplash.com/photo-1499793983690-e8df2e7a1a55?w=800&q=80",
    available: true,
    ownerWalletAddress: "0x0000000000000000000000000000000000000001",
  },
  {
    id: "pinamar-beach",
    title: "Depto a 2 cuadras del mar",
    location: "Pinamar, Buenos Aires",
    pricePerNight: 0.05,
    amenities: ["wifi", "pileta", "aire"],
    rating: 4.6,
    imageUrl: "https://images.unsplash.com/photo-1499793983690-e8df2e7a1a55?w=800&q=80",
    available: true,
    ownerWalletAddress: "0x0000000000000000000000000000000000000001",
  },
  {
    id: "cordoba-sierra",
    title: "Cabaña en las sierras",
    location: "Villa General Belgrano, Córdoba",
    pricePerNight: 0.05,
    amenities: ["wifi", "parrilla", "chimenea"],
    rating: 4.3,
    imageUrl: "https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?w=800&q=80",
    available: true,
    ownerWalletAddress: "0x0000000000000000000000000000000000000001",
  },
  {
    id: "palermo-studio",
    title: "Studio en Palermo Soho",
    location: "Buenos Aires, CABA",
    pricePerNight: 0.05,
    amenities: ["wifi", "aire", "cocina"],
    rating: 4.2,
    imageUrl: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80",
    available: true,
    ownerWalletAddress: "0x0000000000000000000000000000000000000001",
  },
  {
    id: "iguazu-house",
    title: "Casa cerca de las cataratas",
    location: "Puerto Iguazú, Misiones",
    pricePerNight: 0.05,
    amenities: ["wifi", "pileta", "jardin"],
    rating: 4.9,
    imageUrl: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80",
    available: true,
    ownerWalletAddress: "0x0000000000000000000000000000000000000001",
  },
];

export type ListingFilters = {
  destino?: string;
  precioMax?: number;
  amenities?: string[];
};
