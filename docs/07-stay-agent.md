# StayAgent — idea elegida

## Pitch

Un agente busca alojamientos por lenguaje natural, el usuario elige, y el agente **paga USDC onchain** con su wallet para reservar.  
Fase 1 usa catálogo propio + x402 + CDP en Base Sepolia.

## Por qué esta idea

- Simple de entender: buscar → elegir → pagar.
- El agente actúa solo en el paso que importa (el pago).
- Sirve para aprender x402 + wallets CDP con un flujo real.
- World ID y 0G se suman después, sin bloquear el MVP.

## Fases

| Fase | Qué | Estado |
| --- | --- | --- |
| **1** | Catálogo mock + wallet agente + pago x402 testnet | En código |
| **2** | World ID antes de pagos grandes / subir límite | Pendiente |
| **3** | Recibo JSON a 0G Storage (hash en UI) | Pendiente |
| **4** | Discovery Bazaar / fuentes externas (stretch) | Opcional |

## Stack Fase 1

- Next.js App Router
- `@coinbase/cdp-sdk` — `CdpX402Client` (payer) + facilitator CDP
- `@x402/next` (`withX402`) + `@x402/fetch`
- Base Sepolia USDC

World AgentKit y 0G **no** se usan en Fase 1 (a propósito).

## Archivos clave

```
app/page.tsx                         UI
app/api/listings/route.ts            GET catálogo
app/api/listings/[id]/buy/route.ts  POST x402 (vendedor)
app/api/agent/search/route.ts        NLP → filtros
app/api/agent/purchase/route.ts      agente paga
lib/listings-data.ts                 mock
lib/agent-payer.ts                   CdpX402Client
lib/x402-server.ts                   resource server
scripts/create-wallet.ts             setup wallets + faucet
```

## Qué tenés que configurar vos

1. CDP API keys + wallet secret
2. `npm run setup:wallets`
3. Pegar addresses en `.env.local`
4. `npm run dev` y probar una reserva
