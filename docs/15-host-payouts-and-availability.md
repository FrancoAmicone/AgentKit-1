# Host payouts + días disponibles

**Status: implemented** (wallet de anfitrión + ventanas de disponibilidad).

Decisión de producto: **por ahora una sola wallet (marketplace) recibe el
dinero por default**, pero cada anfitrión ya puede **registrar su wallet de
cobro una sola vez** y queda **anclada a todas las propiedades** que publique,
cada una con sus propios **días disponibles**.

## Modelo de cobro (payTo)

Resolución por listing, en orden (`lib/listings.ts → getAllListings`):

```
1. payoutAddress del listing      (override por propiedad)
2. wallet del perfil del anfitrión (lib/host-profile.ts — se registra una vez)
3. MARKETPLACE_WALLET_ADDRESS      (default actual: wallet única del demo)
```

- El x402 del `/buy` usa el resultado como `payTo`: el USDC liquida directo
  en esa wallet en Base Sepolia (no hay custodia intermedia).
- El seed del catálogo siempre cobra en el marketplace.
- Cambiar la wallet del perfil re-apunta **todas** las propiedades del
  anfitrión que no tengan override, sin migrar datos (se resuelve al leer).
- Borrar la wallet del perfil vuelve al default del marketplace.

### Stores

| Store | Archivo | Contenido |
| --- | --- | --- |
| Perfil anfitrión | `data/host-profiles.json` (`/tmp` en Vercel) | `hostId → { payoutAddress, updatedAt }` |
| Propiedades | `data/host-listings.json` | `payoutAddress?` (override) + `availabilityWindows?` |

Identidad = cookie `stay_host_id` (igual que [14](./14-two-sided-ui.md)).

## Días disponibles (availability windows)

Cada propiedad puede definir **ventanas** en las que se ofrece
(`availabilityWindows: DateRange[]`, semiabiertas `[desde, hasta)` — mismas
semánticas que los bookings). Sin ventanas = se ofrece todo el año.

- **Ficha pública:** el calendario pinta 3 estados — reservado (rojo),
  **no ofrecido** (gris, fuera de toda ventana) y libre. Además se lista
  “El anfitrión lo ofrece: …”.
- **Validación server:** `stayWithinAvailability` en `/buy`, `/purchase` y
  `/approve/prepare` — cada noche del stay debe caer dentro de alguna
  ventana **y** no pisar bookings. UI y API rechazan lo mismo.
- **Gestión:** al publicar (form) o después (panel anfitrión, editor con
  agregar/quitar). Máximo 12 ventanas por propiedad.

## APIs

| Ruta | Qué hace |
| --- | --- |
| `GET/POST /api/host/profile` | Leer / registrar / borrar (string vacío) la wallet del anfitrión |
| `PATCH /api/host/listings/[id]` | Actualizar `availabilityWindows` y/o `payoutAddress` (solo el dueño de la cookie) |
| `GET /api/host/listings` | Ahora incluye `profile` y, por propiedad, `payout: { address, source: "listing" \| "host" \| "marketplace" }` |
| `POST /api/host/listings` | Acepta `availabilityWindows` al publicar |

## Roadmap (después de esta etapa)

1. **Verificar propiedad de la wallet** — hoy el anfitrión pega una dirección
   y se le cree (demo). Siguiente paso: challenge de firma (SIWE / personal
   sign) para probar que controla la wallet antes de anclarla.
2. **Anfitrión verificado con World** — simétrico al comprador: AgentBook /
   World ID también del lado que cobra.
3. **Splits / fee de marketplace** — hoy 100% va al `payTo`; a futuro, split
   onchain (p. ej. 97/3) o settlement en dos patas.
4. **Persistencia real** — mover perfiles/propiedades/bookings de file store
   a KV/DB antes de mainnet (ya listado en [06](./06-checklist.md)).
5. **iCal / sincronización de calendarios** — importar ventanas desde otros
   sistemas de reservas.

## Cómo probar

1. `/host` → panel **“Tu wallet de cobro”** → registrar `0x…` → todas tus
   propiedades pasan a “(tu wallet de anfitrión)”.
2. Publicar una propiedad con ventana (p. ej. 15 dic → 28 feb) → en la ficha
   pública los días fuera de la ventana quedan grises (“No ofrecido”) y el
   server rechaza reservas fuera de ella (409).
3. Overridear la wallet en una propiedad puntual → esa cobra en su wallet,
   el resto sigue con la del perfil.
4. Borrar la wallet del perfil → vuelve al default del marketplace.

Relación: [14-two-sided-ui.md](./14-two-sided-ui.md) (base de dos lados) ·
checklist [06](./06-checklist.md) · índice [README.md](./README.md)
