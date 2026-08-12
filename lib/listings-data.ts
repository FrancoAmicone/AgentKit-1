import type { DateRange } from "./dates";

export type Listing = {
  id: string;
  title: string;
  location: string;
  /** Short public description shown on the listing page. */
  description: string;
  pricePerNight: number;
  amenities: string[];
  rating: number;
  imageUrl: string;
  maxGuests: number;
  /** Wallet that receives the x402 payment for this listing. */
  ownerWalletAddress: string;
  /** "seed" = demo catalog (marketplace wallet) · "host" = published by a host. */
  source: "seed" | "host";
  /** Present on host-published listings (used to resolve the host payout wallet). */
  hostId?: string;
  /**
   * Host-defined windows when the property is offered (half-open, checkout
   * exclusive — same semantics as bookings). Absent/empty = always offered.
   */
  availabilityWindows?: DateRange[];
};

/**
 * Mock catalog for the demo. Seed listings pay to MARKETPLACE_WALLET_ADDRESS
 * at runtime (see lib/listings.ts); host-published listings can pay directly
 * to the host's wallet.
 *
 * Pricing for testnet demos:
 * - $0.05/noche → 1 noche queda bajo el tope default ($0.1)
 * - $0.20/noche → supera el tope → NEEDS_HUMAN_APPROVAL
 */
export const LISTINGS_SEED: Listing[] = [
  {
    id: "bariloche-cabin",
    title: "Cabaña con pileta en Bariloche",
    location: "Bariloche, Río Negro",
    description:
      "Cabaña de madera rodeada de coihues, con pileta climatizada y parrilla techada. A 10 minutos del Cerro Catedral, ideal para escapadas de montaña en cualquier época del año.",
    pricePerNight: 0.05,
    amenities: ["pileta", "wifi", "cochera", "parrilla"],
    rating: 4.7,
    imageUrl: "https://images.unsplash.com/photo-1518780664697-55e0ad1cb9a4?w=800&q=80",
    maxGuests: 6,
    ownerWalletAddress: "0x0000000000000000000000000000000000000001",
    source: "seed",
  },
  {
    id: "bariloche-lakehouse",
    title: "Casa frente al lago",
    location: "Bariloche, Río Negro",
    description:
      "Casa con muelle propio sobre el Nahuel Huapi. Ventanales al lago, chimenea de piedra y kayaks incluidos. Atardeceres que no se olvidan.",
    pricePerNight: 0.2,
    amenities: ["wifi", "pileta", "lago", "cochera"],
    rating: 4.6,
    imageUrl: "https://images.unsplash.com/photo-1449844908441-8829872d2607?w=800&q=80",
    maxGuests: 8,
    ownerWalletAddress: "0x0000000000000000000000000000000000000001",
    source: "seed",
  },
  {
    id: "mendoza-vineyard",
    title: "Casa entre viñedos",
    location: "Mendoza, Mendoza",
    description:
      "Casona entre hileras de malbec con vista a la cordillera. Desayuno regional incluido y degustaciones a metros de la puerta. Perfecta para el enoturismo.",
    pricePerNight: 0.2,
    amenities: ["wifi", "estacionamiento", "desayuno"],
    rating: 4.8,
    imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
    maxGuests: 5,
    ownerWalletAddress: "0x0000000000000000000000000000000000000001",
    source: "seed",
  },
  {
    id: "ushuaia-loft",
    title: "Loft frente al canal",
    location: "Ushuaia, Tierra del Fuego",
    description:
      "Loft luminoso con vista al canal Beagle y a los barcos que zarpan a la Antártida. Calefacción central y cafetera de especialidad para los días de viento.",
    pricePerNight: 0.05,
    amenities: ["wifi", "calefaccion", "vista"],
    rating: 4.5,
    imageUrl: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80",
    maxGuests: 3,
    ownerWalletAddress: "0x0000000000000000000000000000000000000001",
    source: "seed",
  },
  {
    id: "salta-adobe",
    title: "Adobe con patio",
    location: "Salta, Salta",
    description:
      "Casa de adobe restaurada en el casco histórico, con patio de naranjos y galería fresca. A cuadras de la peña y del mercado artesanal.",
    pricePerNight: 0.2,
    amenities: ["wifi", "patio", "cochera"],
    rating: 4.4,
    imageUrl: "https://images.unsplash.com/photo-1499793983690-e8df2e7a1a55?w=800&q=80",
    maxGuests: 4,
    ownerWalletAddress: "0x0000000000000000000000000000000000000001",
    source: "seed",
  },
  {
    id: "pinamar-beach",
    title: "Depto a 2 cuadras del mar",
    location: "Pinamar, Buenos Aires",
    description:
      "Departamento renovado con balcón, pileta compartida y bajada directa a la playa. Ideal para semanas de verano o findes largos frente al mar.",
    pricePerNight: 0.2,
    amenities: ["wifi", "pileta", "aire"],
    rating: 4.6,
    imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80",
    maxGuests: 4,
    ownerWalletAddress: "0x0000000000000000000000000000000000000001",
    source: "seed",
  },
  {
    id: "cordoba-sierra",
    title: "Cabaña en las sierras",
    location: "Villa General Belgrano, Córdoba",
    description:
      "Cabaña alpina con chimenea y parrilla, en un lote arbolado con arroyo propio. Cerca de las cervecerías del pueblo y de los senderos del Champaquí.",
    pricePerNight: 0.2,
    amenities: ["wifi", "parrilla", "chimenea"],
    rating: 4.3,
    imageUrl: "https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?w=800&q=80",
    maxGuests: 5,
    ownerWalletAddress: "0x0000000000000000000000000000000000000001",
    source: "seed",
  },
  {
    id: "palermo-studio",
    title: "Studio en Palermo Soho",
    location: "Buenos Aires, CABA",
    description:
      "Studio de diseño en el corazón de Palermo Soho: cocina equipada, aire acondicionado y terraza compartida. Bares, ferias y subte a pasos.",
    pricePerNight: 0.05,
    amenities: ["wifi", "aire", "cocina"],
    rating: 4.2,
    imageUrl: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80",
    maxGuests: 2,
    ownerWalletAddress: "0x0000000000000000000000000000000000000001",
    source: "seed",
  },
  {
    id: "iguazu-house",
    title: "Casa cerca de las cataratas",
    location: "Puerto Iguazú, Misiones",
    description:
      "Casa con jardín tropical y pileta, a 15 minutos del Parque Nacional Iguazú. Tucanes de visita al desayuno y hamacas paraguayas bajo los mangos.",
    pricePerNight: 0.2,
    amenities: ["wifi", "pileta", "jardin"],
    rating: 4.9,
    imageUrl: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80",
    maxGuests: 6,
    ownerWalletAddress: "0x0000000000000000000000000000000000000001",
    source: "seed",
  },
  {
    id: "elcalafate-view",
    title: "Casa con vista al glaciar",
    location: "El Calafate, Santa Cruz",
    description:
      "Casa patagónica con ventanal panorámico al lago Argentino. Calefacción por losa radiante y desayuno con calafates para las mañanas heladas.",
    pricePerNight: 0.2,
    amenities: ["wifi", "calefaccion", "vista"],
    rating: 4.7,
    imageUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80",
    maxGuests: 5,
    ownerWalletAddress: "0x0000000000000000000000000000000000000001",
    source: "seed",
  },
  {
    id: "mardelplata-balcon",
    title: "Depto con balcón al mar",
    location: "Mar del Plata, Buenos Aires",
    description:
      "Departamento clásico marplatense con balcón a la costa. Aire acondicionado, cochera opcional y alfajores de bienvenida.",
    pricePerNight: 0.2,
    amenities: ["wifi", "balcon", "aire"],
    rating: 4.1,
    imageUrl: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80",
    maxGuests: 4,
    ownerWalletAddress: "0x0000000000000000000000000000000000000001",
    source: "seed",
  },
  {
    id: "rosario-river",
    title: "Loft sobre el río",
    location: "Rosario, Santa Fe",
    description:
      "Loft industrial con vista al Paraná y a las islas. Cocina integrada, bicicletas incluidas y la costanera a una cuadra.",
    pricePerNight: 0.2,
    amenities: ["wifi", "cocina", "vista"],
    rating: 4.3,
    imageUrl: "https://images.unsplash.com/photo-1502672023489-198f66b3d4e5?w=800&q=80",
    maxGuests: 3,
    ownerWalletAddress: "0x0000000000000000000000000000000000000001",
    source: "seed",
  },
];

export type ListingFilters = {
  destino?: string;
  precioMax?: number;
  amenities?: string[];
};
