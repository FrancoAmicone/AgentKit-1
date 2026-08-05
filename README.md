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
| 2C | HITL si supera el tope (World App → pay) | **Hecha** |
| 3 | Recibos 0G | Pendiente |
| — | Agente por usuario | Pendiente |

Checklist: [docs/06-checklist.md](./docs/06-checklist.md).

## Setup

```bash
cp .env.example .env.local
# completar CDP_* keys
npm install
npm run setup:wallets
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000) → **Configurar** (registro + tope).

## Flujo

1. Search → `POST /api/agent/search`  
2. Purchase → AgentBook → tope auto-pay (o HITL) → x402 pay  
3. Confirmación + Basescan  

## Precios demo

- **$0.05** → auto-pay bajo tope $0.1  
- **$0.20** → aprobar en World App → pagar  

## Stack

Next.js 16 · CDP x402 · World AgentBook / IDKit · Base Sepolia  

## Docs

Índice: [`docs/README.md`](./docs/README.md)
