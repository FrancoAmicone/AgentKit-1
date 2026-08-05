# StayAgent

Agente de IA que busca alojamientos en lenguaje natural y **paga la reserva onchain** (USDC en Base Sepolia) con su propia wallet CDP, vía protocolo **x402**.

## Pitch

Pedís algo como *“casa en Bariloche con pileta, menos de 150 USD”* → el agente filtra un catálogo → elegís → el agente ejecuta el pago real de testnet y confirma la reserva.

## Estado

| Fase | Incluye | Estado |
| --- | --- | --- |
| 1 | Catálogo mock + NLP + x402 Base Sepolia | **Hecha** |
| 2A | AgentBook (payer) + registro World App in-UI | **Hecha** |
| 2B | Tope auto-pay (default $0.1) + modal Configurar | **Hecha** |
| 2C | HITL si supera el tope | Pendiente |
| 3 | Recibos 0G | Pendiente |
| — | Agente por usuario (crear/registrar wallet) | Pendiente |

Docs de fase: [08](./docs/08-phase2-agentbook.md) · [09](./docs/09-phase2b-autopay-limit.md) · [checklist](./docs/06-checklist.md).

## Setup

1. Copiá env:

```bash
cp .env.example .env.local
```

2. Completá `CDP_API_KEY_ID`, `CDP_API_KEY_SECRET`, `CDP_WALLET_SECRET` desde [CDP Portal](https://portal.cdp.coinbase.com).

3. Creá wallets y pedí faucet:

```bash
npm install
npm run setup:wallets
```

Pegá en `.env.local` las líneas `AGENT_WALLET_ADDRESS` y `MARKETPLACE_WALLET_ADDRESS` que imprime el script.

4. Corré la app:

```bash
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000).

5. **Configurar** (chip UI) → registrar agente con World App si hace falta → ajustar tope.

## Flujo

1. UI → `POST /api/agent/search` (interpreta query → filtra listings)
2. Elegís un lugar → `POST /api/agent/purchase`
3. Gates: AgentBook human-backed → tope auto-pay → x402 pay
4. El agente llama `POST /api/listings/[id]/buy` con `x402-fetch`
5. Reserva confirmada + meta de pago / link Basescan

## Precios demo

- **$0.05** — bajo tope default ($0.1) → auto-pay  
- **$0.20** — sobre tope → `NEEDS_HUMAN_APPROVAL` (HITL = 2C)

## Stack

- Next.js 16 (App Router) + TypeScript
- `@coinbase/cdp-sdk` (`CdpX402Client`, Server Wallets)
- `@worldcoin/agentkit` + `@worldcoin/idkit-core` (AgentBook)
- `@x402/next` + `@x402/fetch`
- Base Sepolia

## Docs

- [StayAgent — spec, APIs, env, fases](./docs/07-stay-agent.md)
- [Checklist de setup](./docs/06-checklist.md) — **marcar al terminar cada tarea**
- Índice: [`docs/README.md`](./docs/README.md)
