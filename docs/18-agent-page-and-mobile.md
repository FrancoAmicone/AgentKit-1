# Dashboard del agente (modal)

**Status: implemented.** El chip y la tab **Mi agente** abren un sheet/modal
en el lugar: el catálogo (o la ficha) **sigue montado** detrás. Cerrar
vuelve exactamente a donde estabas, sin recargar.

## Por qué

Navegar a `/agent` desmontaba la página actual. En el teléfono eso se
veía como una pantalla vacía y había que recargar para volver. El
pedido es ver el agente **ahí mismo**, en teléfono y escritorio.

El sheet:

- Portal a `document.body` (fuera de `.app-root`, para que `position:fixed` valga).
- Muestra el dashboard completo (crear, saldo, World, tope) — no un
  wizard de un paso que parece “Cargando…”.
- Lock de scroll solo con `overflow: hidden` (nunca `position: fixed` en `body`).
- Error boundary: si el panel falla, la página de atrás no se cae.

`/agent` sigue existiendo por si alguien entra directo a la URL.

## Qué ves en el modal

| Bloque | Contenido |
| --- | --- |
| Checklist | Crear · Fondos · World · Tope · Listo |
| Cards | USDC, ETH, tope automático |
| Wallet | address, QR, copy, faucets, Basescan |
| World | registro AgentBook |
| Tope | editar el auto-pay |

## Shell móvil

- Header compacto (logo + chip). Nav de texto solo desde `md`.
- Tab bar: Explorar · Anfitrión · **Mi agente** (botón, abre el modal).
- `NavigationReset` no toca el overflow si el modal está abierto.
- Sin `background-attachment: fixed` ni animaciones `transform` en
  viewport chico.

## Fotos

Archivos en `/public/listings/` (Wikimedia Commons, destinos reales de
Argentina). `ListingImage` cae a un fallback local si la URL falla. En
anfitrión hay un picker de esas referencias; también se acepta
`/listings/…` además de `https://`. En la ficha: “Ver en Maps”
(`maps/search?api=1&query=…`).
