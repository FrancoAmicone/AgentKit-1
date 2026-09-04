# Checklist — StayAgent

## Higiene de docs

Cada vez que se termina una tarea: **actualizar este checklist + docs de la fase** en el mismo cambio.

---

## Fase 1 — MVP (testnet x402)

### Cuentas

- [x] Cuenta en [CDP Portal](https://portal.cdp.coinbase.com)
- [x] Crear API key → `CDP_API_KEY_ID` + `CDP_API_KEY_SECRET`
- [x] Crear / copiar `CDP_WALLET_SECRET`
- [ ] (Opcional) `OPENAI_API_KEY` o `ANTHROPIC_API_KEY` para mejor NLP

### Proyecto

- [x] `.env.local` / env vars con las 3 keys CDP
- [x] `npm install` (o deploy Vercel)
- [x] `npm run setup:wallets`
- [x] `AGENT_WALLET_ADDRESS` + `MARKETPLACE_WALLET_ADDRESS` configuradas
- [x] `CDP_X402_CLIENT_ENVIRONMENT=development`
- [x] App corriendo (local y/o Vercel)

### Probar el flujo

- [x] Buscar lodging en lenguaje natural
- [x] Ver tarjetas / resultados
- [x] **Reservar y pagar** con éxito (Bariloche · USDC testnet)
- [x] Ver confirmación + link Basescan Sepolia
- [ ] (Opcional) Reintentar el mismo listing → debe fallar (ya reservado)
- [ ] (Opcional) Verificar que el USDC llegó a `MARKETPLACE_WALLET_ADDRESS`

**Fase 1: DONE**

---

## Fase 2A — AgentBook gate (solo agente que compra)

Ver [08-phase2-agentbook.md](./08-phase2-agentbook.md).

- [x] Código: gate + status + registro in-app (QR / deep link)
- [x] Marketplace/receiver **sin** verificación (by design)
- [x] Popup **Configurar**; registro solo si falta
- [x] Demo registrada → badge **Human-backed ✓**
- [x] Pago bajo tope ($0.05)

**Fase 2A: DONE**

---

## Fase 2B — Auto-pay limit

Ver [09-phase2b-autopay-limit.md](./09-phase2b-autopay-limit.md).

- [x] Código: limits API + gate + UI modal
- [x] Min **$0.01**; default **$0.1**
- [x] Catálogo demo **$0.05** / **$0.2**
- [x] Guardar tope y pagar $0.05

**Fase 2B: DONE**

---

## Fase 2C — Human-in-the-loop

Ver [10-phase2c-hitl.md](./10-phase2c-hitl.md).

- [x] Código: `approve/prepare` + `approve/complete` + `approvalToken` en purchase
- [x] UI: modal aprobar gasto alto con World App (QR / deep link)
- [x] Probar en prod: listing **$0.2** + tope **$0.1** → World App → paga  
  (ej. Bariloche lago · agent `0xFC80…0305` · recibo 0G + tx Galileo)

**Fase 2C: DONE** (código + validación prod)

### Refactor React best practices

- [x] Shared `Modal` (portal) + `WorldAppVerifyPanel` + `waitForWorldBridgeProof` (`AbortSignal`)
- [x] HITL / register / setup usan los mismos primitivos; abort al cerrar
- [x] `useAgentSession` + `ListingCard`; `useEffectEvent` para auto-open Configurar
- [x] Documentar atajos demo en [11-demo-tradeoffs.md](./11-demo-tradeoffs.md)

---

## Multi-user + Fase 3 (0G) — design

Ver [12-multiuser-and-0g.md](./12-multiuser-and-0g.md). **Cada usuario = su wallet + su agente** (no el payer compartido del demo).

### Multi-user agents

- [x] Design doc (flujo + APIs)
- [x] Sesión: cookie httpOnly → CDP `accountName` (opción A del design)
- [x] `POST /api/agent/create` + `GET /api/agent/me` + UI wizard
- [x] Fondear wallet (Copy / QR / saldo USDC)
- [x] Scope register / tope / HITL / purchase al agente de la sesión
- [x] Default: sin `stay-agent-payer` (solo si `DEMO_SHARED_AGENT=true`)

### Fase 3 — 0G Storage

- [x] Design doc (recibo post-compra; agente no “corre” en 0G)
- [x] `lib/og-storage.ts` — upload soft-fail tras compra
- [x] Mostrar content hash / skipped en UI
- [x] Guía env + faucet: [13-env-and-0g-setup.md](./13-env-and-0g-setup.md)
- [x] Ops: `OG_PRIVATE_KEY` en Vercel + recibo onchain verificado  
  (root `0x4606…bd90` · [tx Galileo](https://chainscan-galileo.0g.ai/tx/0x4920dbb3ac3adfbd428a614216c781f1c9f45cf90759380907b8251c2af8cf29))

**Multi-user + Fase 3: DONE** (código + validación prod HITL + 0G)

Detalle 0G: [03-0g.md](./03-0g.md).

---

## UI product polish

- [x] Home: brand StayAgent hero + search CTA + receipt confirmation
- [x] Configurar: one-step wizard (crear → fondos → World → tope)
- [x] Listings / motion polish
- [x] Mobile scroll fix (`background-attachment` + body scroll lock iOS)
- [x] Guided guest journey (progress strip + copy-first fund)
- [x] Guided host publish (3 pasos + wallet dedicada explicada)

---

## Two-sided UI (huésped + anfitrión)

Ver [14-two-sided-ui.md](./14-two-sided-ui.md).

- [x] Shell global: `AgentSessionProvider` + `SiteHeader` (nav + chip agente en todas las páginas)
- [x] `/agent` dashboard (saldo, wallet, World, tope) + tab bar móvil + fotos locales
- [x] Fix modal/scroll en teléfono (`body > *` ya no pisa `position:fixed`; lock iOS)
- [x] Home dos lados: hero huésped/anfitrión + catálogo completo + chips de búsqueda
- [x] Ficha pública `/stays/[id]`: descripción + calendario de disponibilidad público
- [x] Bookings por rango de fechas (`lib/bookings.ts`, checkout exclusivo, máx 30 noches)
- [x] Precio total = noches × precio/noche (402 x402 cobra el total; tope/HITL sobre el total)
- [x] Modo anfitrión `/host`: publicar propiedad + wallet de cobro + reservas recibidas (tx Basescan)
- [x] `payTo` por listing: wallet del anfitrión si la cargó (seed → marketplace)
- [x] `/como-funciona`: explicación en producto de ambos lados y las piezas
- [x] Lint + build + smoke test (catálogo, search, disponibilidad, publicar, gates de fechas)
- [ ] Probar pago real testnet sobre rango de fechas (necesita CDP keys en el entorno)

---

## Host payouts + días disponibles

Ver [15-host-payouts-and-availability.md](./15-host-payouts-and-availability.md).

- [x] Perfil anfitrión: wallet de cobro registrada una vez, anclada a todas sus propiedades (`lib/host-profile.ts` + `GET/POST /api/host/profile`)
- [x] Resolución payTo: override por propiedad → wallet del anfitrión → wallet única del marketplace (default actual)
- [x] Días disponibles por propiedad (`availabilityWindows`, semiabiertas, máx 12) al publicar y editables después (`PATCH /api/host/listings/[id]`)
- [x] Catálogo semilla: ventanas aleatorias determinísticas por listing (`lib/seed-availability.ts`) al leer `getAllListings`
- [x] Validación server en `/buy` + `/purchase` + `/approve/prepare` (409 fuera de ventana)
- [x] Calendario 3 estados: reservado / no ofrecido / libre (ficha pública + panel anfitrión)
- [x] Panel `/host`: “Tu wallet de cobro” + editor de ventanas + fuente de cobro por propiedad
- [x] Lint + build + smoke tests (resolución de wallets, PATCH, 403 sin cookie, gates) + test visual browser
- [x] Anfitrión World-verified (AgentBook sobre wallet de cobro; gate al publicar)
- [ ] Futuro: verificar firma de la wallet (SIWE), splits/fee, KV/DB (ver roadmap doc 15)

---

## Host payTo verification + stay 404 fix

Ver [16-host-payto-verification.md](./16-host-payto-verification.md).

- [x] Shared `lib/demo-store.ts` (file local / Vercel Runtime Cache) for host listings, profiles, bookings
- [x] Stay page soft-load (no hard `notFound`); client refetch + retry
- [x] Publish → `router.push` to `/stays/[id]`
- [x] `resolveListingPayTo` shared by listing API + `/buy`; UI shows “Cobro automático → wallet del anfitrión”
- [ ] Probar pago real testnet al wallet del host (CDP keys + USDC Base Sepolia)

---

## Host World verification

Ver [17-host-world-verify.md](./17-host-world-verify.md).

- [x] `REQUIRE_HUMAN_BACKED_HOST` + `getHostBookStatus` / `assertHostPayoutIsHumanBacked`
- [x] `/api/host/register/prepare` + `complete` (AgentBook sobre payout)
- [x] Gate `POST /api/host/listings` + `/buy` cuando payTo es host/listing
- [x] UI `/host`: verificar con World App antes de publicar
- [x] Docs + `.env.example`

---

## Fase 4 — Discovery (stretch)

- [ ] Bazaar / agentic.market

---

## Antes de mainnet

- [ ] Persistencia real (DB / KV)
- [ ] Mainnet Base + USDC real
- [ ] No commitear secrets
