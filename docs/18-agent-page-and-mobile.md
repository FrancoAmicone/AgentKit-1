# Dashboard del agente + mobile shell

**Status: implemented.** El chip “Mi agente” ya no abre un wizard que
rompía la página en el teléfono: hay una superficie `/agent` con saldo,
wallet, World y tope, y la navegación móvil usa tabs fijos.

## Por qué

En el teléfono:

- **Mi agente** era un modal portal. `body > * { position: relative }` le
  sacaba el `position: fixed`, el overlay se metía en el flujo del
  documento y “rompía” la página (y el scroll quedaba lockeado al navegar).
- El wizard solo mostraba el paso actual: no se veía cuánta plata tiene el
  agente ni el resto de las funciones.
- Las fotos del catálogo venían de Unsplash (hotlink / 404) y fallaban.
- El nav del header se wrapeaba a full-width y, al ir y volver entre
  páginas, el overflow del body se quedaba `hidden`.

## Superficie `/agent`

Muestra todo junto (no un paso a la vez):

| Bloque | Qué ves |
| --- | --- |
| Checklist | Crear · Fondos · World · Tope |
| Cards | USDC, ETH, tope automático |
| Wallet | address, QR, copy, faucets, Basescan |
| World | registro AgentBook (mismo panel que el anfitrión) |
| Tope | editar el auto-pay |
| Acciones | explorar, modo anfitrión, volver a la reserva (`?next=`) |

Header y tab bar apuntan a `/agent`. Si falta setup al reservar, la ficha
manda a `/agent?next=/stays/[id]`.

## Shell móvil

- Header compacto (logo + chip). Nav de texto solo desde `md`.
- Tab bar fija abajo: Explorar · Anfitrión · Mi agente.
- `NavigationReset` al cambiar de ruta: restaura overflow y scrollea al tope.
- El único modal que queda es HITL de compra. El lock de scroll usa
  `overflow: hidden` — **nunca** `position: fixed` en `body` (eso dejaba
  el teléfono trabado si el sheet no terminaba de cargar).
- Sin `background-attachment: fixed` ni animaciones `transform` en
  viewport chico (evita el “bugueo” al navegar).

## Fotos

Archivos en `/public/listings/` (Wikimedia Commons, destinos reales de
Argentina). `ListingImage` cae a un fallback local si la URL falla. En
anfitrión hay un picker de esas referencias; también se acepta
`/listings/…` además de `https://`. En la ficha: “Ver en Maps”
(`maps/search?api=1&query=…`).
