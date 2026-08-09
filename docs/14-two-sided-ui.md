# Two-sided UI — huésped + anfitrión, fechas y disponibilidad pública

**Status: implemented.**

Salto de producto: de una landing única de demo a una app navegable con dos
lados (huésped y anfitrión), reservas **por rango de fechas** y calendario de
disponibilidad **público** por alojamiento.

## Qué cambió (resumen)

| Antes | Ahora |
| --- | --- |
| Una sola página (search + tarjetas + compra) | 4 superficies: `/` (explorar), `/stays/[id]` (ficha pública), `/host` (panel anfitrión), `/como-funciona` |
| Reservar = `available: false` para siempre (in-memory) | Booking con `checkIn/checkOut` (checkout exclusivo) persistido en file store; el listing sigue publicado y solo se bloquean esas noches |
| Precio = 1 noche fija | Total = `noches × pricePerNight` (micros exactos); el 402 de x402 cobra el total |
| Tope/HITL sobre `pricePerNight` | Tope/HITL sobre el **total del stay**; la aprobación World queda atada a listing + monto total |
| Solo lado comprador | Anfitrión publica propiedades (cookie `stay_host_id`), ve reservas recibidas y puede cobrar en **su** wallet |
| `payTo` siempre marketplace | `payTo = ownerWalletAddress` del listing: wallet del anfitrión si la cargó, marketplace para el seed |

## Superficies

### `/` — Explorar (huésped)

- Hero de dos lados (Soy huésped / Soy anfitrión) + búsqueda NLP con chips.
- Catálogo completo por default (seed + publicados por anfitriones).
- Las tarjetas navegan a la ficha pública; **la compra ya no vive en la home**.

### `/stays/[id]` — Ficha pública

- Foto, descripción, amenities, rating, huéspedes máx, wallet de cobro.
- **Calendario público** (`AvailabilityCalendar`): cualquiera ve las noches
  bloqueadas sin registrarse ni pagar (server-rendered, `force-dynamic`).
- Selección check-in → check-out (solo noches libres), total en vivo,
  reserva con el agente: auto-pay bajo tope o modal HITL World sobre tope.
- Recibo (Basescan + 0G) con fechas del stay.

### `/host` — Modo anfitrión

- Form “Nueva propiedad”: título, ubicación, descripción, precio/noche USDC,
  huéspedes, amenities, foto (opcional) y **wallet de cobro** (opcional).
- “Mis propiedades”: calendario compacto de fechas bloqueadas + lista de
  reservas recibidas (fechas, noches, monto, agente pagador, tx Basescan).
- Identidad anfitrión = cookie httpOnly `stay_host_id` (mismo criterio que la
  sesión del agente comprador — opción A de [12](./12-multiuser-and-0g.md)).

### `/como-funciona`

Explica en producto los dos lados y las piezas (CDP, x402, AgentBook,
tope+HITL, 0G).

### Shell global

`AgentSessionProvider` (contexto React) + `SiteHeader` en el layout: el estado
del agente y el wizard Configurar están disponibles en todas las páginas. Se
quitó el auto-open del wizard; ahora hay chip en el header + nudges
contextuales.

## Modelo de datos

```ts
// lib/listings-data.ts — Listing (sin `available`)
type Listing = {
  id; title; location; description; pricePerNight; amenities; rating;
  imageUrl; maxGuests; ownerWalletAddress; source: "seed" | "host";
};

// lib/bookings.ts — Booking (file store data/bookings.json, /tmp en Vercel)
type Booking = {
  id; listingId;
  checkIn: string;   // YYYY-MM-DD
  checkOut: string;  // exclusivo
  nights; amountUsdc; guestAgentAddress?; txHash?; usedHumanApproval?;
  createdAt; source: "onchain" | "seed";
};

// lib/host-listings.ts — HostListing (data/host-listings.json)
type HostListing = Listing & { hostId; createdAt; payoutAddress? };
```

- Disponibilidad = no solapamiento de rangos semiabiertos `[checkIn, checkOut)`.
- Bookings “seed” (`lib/bookings.ts → demoSeedBookings`) se calculan relativo a
  hoy para que los calendarios muestren noches bloqueadas desde el primer día;
  no se persisten.
- Máximo 30 noches por reserva (`MAX_NIGHTS`).

## APIs

| Ruta | Cambio |
| --- | --- |
| `GET /api/listings/[id]` | **Nueva**: listing + `bookedRanges` públicos |
| `GET/POST /api/host/listings` | **Nueva**: panel + publicar (cookie host) |
| `POST /api/listings/[id]/buy` | Query `checkIn/checkOut/agent`; 402 con precio total; al pagar crea Booking; 409 si el rango se ocupó |
| `POST /api/agent/purchase` | Body con `checkIn/checkOut`; gates sobre el total; adjunta `txHash` al booking; recibo 0G con fechas |
| `POST /api/agent/approve/prepare` | Acepta fechas; HITL atado al total del stay |
| `GET /api/listings` | Async + sin filtro `available` |

## Atajos demo conscientes (extiende [11](./11-demo-tradeoffs.md))

- Bookings y host listings en file store (`/tmp` en Vercel — no durable).
- `agent` query param en `/buy` es informativo (no verificado onchain).
- Sin verificación World del anfitrión; sin cancelaciones ni reembolsos.
- Carrera 402→pay→retry: si el rango se ocupa en el medio, el handler devuelve
  409 después de liquidado el pago (igual que el caso “already reserved” previo).

## Cómo probar

1. `/host` → publicar propiedad (opcional: wallet de cobro propia).
2. `/` → buscarla o verla en el catálogo → entrar a la ficha.
3. Elegir noches libres → total en vivo → Reservar:
   - total ≤ tope → auto-pay x402;
   - total > tope → World App HITL → paga.
4. Ver el calendario bloqueado (público) + panel anfitrión con la reserva y tx.

Checklist: [06-checklist.md](./06-checklist.md) · índice: [README.md](./README.md)
