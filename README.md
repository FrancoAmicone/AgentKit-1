# StayAgent

Agente de IA que busca alojamientos en lenguaje natural y **paga la reserva onchain** (USDC en Base Sepolia) con su propia wallet CDP, vía protocolo **x402**.

## Pitch

Pedís algo como *“casa en Bariloche con pileta, menos de 150 USD”* → el agente filtra un catálogo → elegís → el agente ejecuta el pago real de testnet y confirma la reserva.

## Fase 1 (este repo, ahora)

| Incluye | No incluye aún |
| --- | --- |
| Catálogo mock | World ID |
| NLP (rules + LLM opcional) | 0G Storage |
| Wallet CDP del agente | Fuentes externas / Bazaar |
| Endpoint vendedor x402 | Mainnet / plata real |
| Compra end-to-end en Base Sepolia | |

Fases 2–4: ver [docs/07-stay-agent.md](./docs/07-stay-agent.md).

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

## Flujo

1. UI → `POST /api/agent/search` (interpreta query → filtra listings)
2. Elegís un lugar → `POST /api/agent/purchase`
3. El agente llama `POST /api/listings/[id]/buy` con `x402-fetch`
4. Si no hay pago → **402** con precio; el cliente paga USDC y reintenta
5. Reserva confirmada + meta de pago / link Basescan

## Stack

- Next.js 16 (App Router) + TypeScript
- `@coinbase/cdp-sdk` (`CdpX402Client`, Server Wallets)
- `@x402/next` + `@x402/fetch`
- Base Sepolia

## Docs

- [Idea StayAgent + roadmap](./docs/07-stay-agent.md)
- Resúmenes de World / 0G / Coinbase en [`docs/`](./docs/README.md)
