# StayAgent

## Pitch

Un agente de IA busca alojamientos según un pedido en lenguaje natural, muestra opciones, el usuario elige, y el agente **ejecuta el pago real (USDC testnet)** con su propia wallet cripto para reservar el lugar.

- **Búsqueda:** catálogo propio + parser NLP (rules; LLM opcional)  
- **Pago:** protocolo **x402** + wallet CDP (`CdpX402Client`)  
- **Red:** Base Sepolia  
- **Después:** World ID (identidad) y 0G Storage (auditoría)

## Flujo end-to-end (Fase 1)

```
Usuario: "Casa en Bariloche con pileta, menos de 150 USD"
        │
        ▼
POST /api/agent/search
  → parsea query → filtra listings → devuelve tarjetas
        │
        ▼
Usuario elige → "Reservar y pagar"
        │
        ▼
POST /api/agent/purchase { listingId }
  → wallet del agente llama POST /api/listings/[id]/buy
  → si no hay pago: HTTP 402 + precio en USDC
  → x402-fetch paga con CDP wallet y reintenta
  → listing queda reserved + confirmación (+ tx si el facilitator la expone)
```

## Arquitectura

```
┌─────────────┐     search / purchase      ┌──────────────────────┐
│  UI (Next)  │ ─────────────────────────► │  API routes (Node)   │
└─────────────┘                            └──────────┬───────────┘
                                                      │
                    ┌─────────────────────────────────┼─────────────────────┐
                    ▼                                 ▼                     ▼
             lib/nlp.ts                      lib/agent-payer.ts     lib/x402-server.ts
             (rules / LLM)                   CdpX402Client          facilitator CDP
                                             + x402-fetch           + withX402
                    │                                 │                     │
                    ▼                                 ▼                     ▼
             lib/listings*.ts                  Base Sepolia USDC      endpoint /buy
             catálogo mock                     (wallet agente)        (cobra pricePerNight)
```

### Roles de las wallets

| Wallet | Nombre CDP | Rol |
| --- | --- | --- |
| Agente (payer) | `stay-agent-payer` | Paga las reservas |
| Marketplace (receiver) | `stay-marketplace-receiver` | Recibe el USDC del `/buy` |

Ambas se crean con `npm run setup:wallets`.

## Stack Fase 1

| Pieza | Paquete / tech | Uso |
| --- | --- | --- |
| App | Next.js 16 App Router + TS | UI + APIs |
| Payer | `@coinbase/cdp-sdk` → `CdpX402Client` | Firma pagos x402 |
| Seller gate | `@x402/next` → `withX402` | Protege `/buy` |
| HTTP paid client | `@x402/fetch` → `wrapFetchWithPayment` | Ciclo 402 → pay → retry |
| Facilitator | CDP hosted (`createCdpFacilitatorClient`) | Verify/settle |
| Catálogo | `lib/listings-data.ts` | 8 lugares mock AR |
| NLP | `lib/nlp.ts` | Rules; OpenAI/Anthropic opcionales |

**No usado en Fase 1:** World AgentKit, 0G, mainnet, APIs de hoteles reales.

## APIs

### `GET /api/listings`

Catálogo filtrable (público, sin pago).

Query params opcionales:

- `destino` — texto (ej. `Bariloche`)
- `precioMax` — número USDC/noche
- `amenities` — lista separada por comas (`pileta,wifi`)

### `POST /api/agent/search`

Body:

```json
{ "query": "casa en Bariloche con pileta, menos de 150 USD por día" }
```

Respuesta: `filters`, `explanation`, `parser` (`rules` \| `llm`), `results[]` con `matchReason`.

### `POST /api/listings/[id]/buy` (vendedor x402)

- Sin header de pago → **402** con precio `$${pricePerNight}` en Base Sepolia.  
- Con pago válido → marca `available: false` y devuelve la reserva.  
- `payTo` = `MARKETPLACE_WALLET_ADDRESS`.

### `POST /api/agent/purchase`

Body:

```json
{ "listingId": "bariloche-cabin" }
```

El agente paga el `/buy` con su wallet. Devuelve reserva, `agentAddress`, `paymentMeta`, y `txHash` / `explorerUrl` si están disponibles.

## Archivos clave

```
app/page.tsx                         UI buscador + tarjetas + confirmación
app/api/listings/route.ts            GET catálogo
app/api/listings/[id]/buy/route.ts  POST x402 (vendedor)
app/api/agent/search/route.ts        NLP → filtros → resultados
app/api/agent/purchase/route.ts      agente paga
lib/listings-data.ts                 seed del catálogo
lib/listings.ts                      filtros + reserva in-memory
lib/nlp.ts                           parser lenguaje natural
lib/agent-payer.ts                   CdpX402Client + paid fetch
lib/x402-server.ts                   resource server + payTo
scripts/create-wallet.ts             wallets + faucet
.env.example                         variables
```

## Variables de entorno

Ver `.env.example`:

| Variable | Obligatoria Fase 1 | Notas |
| --- | --- | --- |
| `CDP_API_KEY_ID` | Sí | Portal CDP |
| `CDP_API_KEY_SECRET` | Sí | Portal CDP |
| `CDP_WALLET_SECRET` | Sí | Portal CDP |
| `AGENT_WALLET_ADDRESS` | Sí (después del script) | Informativa / checks |
| `MARKETPLACE_WALLET_ADDRESS` | Sí | `payTo` del `/buy` |
| `CDP_X402_CLIENT_ENVIRONMENT` | Recomendada `development` | Base Sepolia |
| `OPENAI_API_KEY` | No | Mejora el NLP |
| `ANTHROPIC_API_KEY` | No | Alternativa NLP |

Nunca exponer keys CDP en `NEXT_PUBLIC_*`.

## Setup rápido

```bash
cp .env.example .env.local
# completar las 3 keys CDP

npm install
npm run setup:wallets
# pegar AGENT_WALLET_ADDRESS y MARKETPLACE_WALLET_ADDRESS en .env.local

npm run dev
# http://localhost:3000
```

Checklist detallado: [06-checklist.md](./06-checklist.md).

## Modelo de listing

```ts
type Listing = {
  id: string;
  title: string;
  location: string;
  pricePerNight: number; // USDC
  amenities: string[];
  rating: number;
  imageUrl: string;
  available: boolean;
  ownerWalletAddress: string; // en runtime = MARKETPLACE_WALLET_ADDRESS
};
```

La disponibilidad se guarda **in-memory** (se resetea al reiniciar el server). Suficiente para Fase 1.

## Fases

### Fase 1 — MVP x402 — **DONE**

Catálogo mock + NLP + pago Base Sepolia. Ver checklist.

### Fase 2A — AgentBook (payer only) — **DONE**

Gate en purchase + registro in-app (QR / deep link) + modal Configurar.  
Docs: [08-phase2-agentbook.md](./08-phase2-agentbook.md)

### Fase 2B — Auto-pay limit — **DONE** (código)

Tope owner (default $0.1, min $0.01); listings demo $0.05 / $0.2.  
Docs: [09-phase2b-autopay-limit.md](./09-phase2b-autopay-limit.md)

### Fase 2C — Human-in-the-loop — **pendiente**

Si `price > tope`, pedir aprobación World antes de pagar (hoy solo bloquea).  
Docs: [02-world-agentkit.md](./02-world-agentkit.md)

### Fase 3 — 0G Storage — **pendiente**

- Por cada pago exitoso, subir JSON recibo:  
  `{ timestamp, listingId, monto, txHash, nullifierHash? }`  
- Mostrar content hash en la UI.  
- Docs: [03-0g.md](./03-0g.md)

### Multi-user agents — **pendiente**

Crear + fondear + registrar wallet por persona (dejar de compartir el agente demo).

### Fase 4 — Discovery (stretch)

- Probar Bazaar / agentic.market para fuentes externas.  
- No depende de que exista un servicio de hoteles real.

## Qué no hacer todavía

- Mainnet / plata real  
- Scraping de Airbnb/Booking  
