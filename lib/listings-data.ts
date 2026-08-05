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
 *
 * Pricing for testnet demos:
 * - $0.05 → under default auto-pay tope ($0.1)
 * - $0.20 → over default tope → NEEDS_HUMAN_APPROVAL
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
    id: "bariloche-lakehouse",
    title: "Casa frente al lago",
    location: "Bariloche, Río Negro",
    pricePerNight: 0.2,
    amenities: ["wifi", "pileta", "lago", "cochera"],
    rating: 4.6,
    imageUrl: "https://images.unsplash.com/photo-1449844908441-8829872d2607?w=800&q=80",
    available: true,
    ownerWalletAddress: "0x0000000000000000000000000000000000000001",
  },
  {
    id: "mendoza-vineyard",
    title: "Casa entre viñedos",
    location: "Mendoza, Mendoza",
    pricePerNight: 0.2,
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
    pricePerNight: 0.2,
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
    pricePerNight: 0.2,
    amenities: ["wifi", "pileta", "aire"],
    rating: 4.6,
    imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80",
    available: true,
    ownerWalletAddress: "0x0000000000000000000000000000000000000001",
  },
  {
    id: "cordoba-sierra",
    title: "Cabaña en las sierras",
    location: "Villa General Belgrano, Córdoba",
    pricePerNight: 0.2,
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
    pricePerNight: 0.2,
    amenities: ["wifi", "pileta", "jardin"],
    rating: 4.9,
    imageUrl: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80",
    available: true,
    ownerWalletAddress: "0x0000000000000000000000000000000000000001",
  },
  {
    id: "elcalafate-view",
    title: "Casa con vista al glaciar",
    location: "El Calafate, Santa Cruz",
    pricePerNight: 0.2,
    amenities: ["wifi", "calefaccion", "vista"],
    rating: 4.7,
    imageUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80",
    available: true,
    ownerWalletAddress: "0x0000000000000000000000000000000000000001",
  },
  {
    id: "mardelplata-balcon",
    title: "Depto con balcón al mar",
    location: "Mar del Plata, Buenos Aires",
    pricePerNight: 0.2,
    amenities: ["wifi", "balcon", "aire"],
    rating: 4.1,
    imageUrl: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80",
    available: true,
    ownerWalletAddress: "0x0000000000000000000000000000000000000001",
  },
  {
    id: "rosario-river",
    title: "Loft sobre el río",
    location: "Rosario, Santa Fe",
    pricePerNight: 0.2,
    amenities: ["wifi", "cocina", "vista"],
    rating: 4.3,
    imageUrl: "https://images.unsplash.com/photo-1502672023489-198f66b3d4e5?w=800&q=80",
    available: true,
    ownerWalletAddress: "0x0000000000000000000000000000000000000001",
  },
];

export type ListingFilters = {
  destino?: string;
  precioMax?: number;
  amenities?: string[];
};
