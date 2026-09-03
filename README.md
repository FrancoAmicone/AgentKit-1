# StayAgent

Marketplace de estadías **de dos lados** con pago onchain: el huésped delega la reserva en un agente de IA con wallet CDP propia (USDC en Base Sepolia, protocolo **x402**); el anfitrión publica su propiedad, muestra un **calendario público de disponibilidad** y cobra directo en su wallet.

## Pitch

Pedís algo como *“casa en Bariloche con pileta, menos de 150 USD”* → el agente filtra el catálogo → elegís fechas libres en el calendario → el agente paga el total (noches × precio) en testnet y esas noches quedan bloqueadas para todos.

## Estado

| Fase | Incluye | Estado |
| --- | --- | --- |
| 1 | Catálogo mock + NLP + x402 Base Sepolia | **Hecha** |
| 2A | AgentBook (payer) + registro World App in-UI | **Hecha** |
| 2B | Tope auto-pay (default $0.1) + modal Configurar | **Hecha** |
| 2C | HITL si supera el tope (World App → pay) | **Hecha** |
| 3 | Recibos 0G | **Hecha** |
| — | Agente por usuario | **Hecha** |
| — | UI dos lados: huésped + anfitrión, fechas y disponibilidad pública | **Hecha** → [docs/14](./docs/14-two-sided-ui.md) |
| — | Wallet de cobro por anfitrión (anclada a sus propiedades) + días disponibles | **Hecha** → [docs/15](./docs/15-host-payouts-and-availability.md) |
| — | Fix 404 post-publish + payTo al host verificable | **Hecha** → [docs/16](./docs/16-host-payto-verification.md) |

Checklist: [docs/06-checklist.md](./docs/06-checklist.md).

## Setup

```bash
cp .env.example .env.local
# completar CDP_* keys
npm install
npm run setup:wallets
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000) → **Mi agente** (`/agent`: saldo, wallet, World, tope).

## Superficies

- `/` — explorar + búsqueda NLP (huésped)  
- `/stays/[id]` — ficha pública con calendario de disponibilidad  
- `/agent` — dashboard del agente (saldo, wallet, World, tope)  
- `/host` — publicar propiedad + reservas recibidas (anfitrión)  
- `/como-funciona` — explicación de ambos lados  

## Flujo

1. Search → `POST /api/agent/search`  
2. Ficha → elegir fechas libres → total = noches × precio  
3. Purchase → AgentBook → tope auto-pay (o HITL) → x402 pay → booking bloquea las noches  
4. Confirmación + Basescan + recibo 0G  

## Precios demo (1 noche)

- **$0.05/noche** → auto-pay bajo tope $0.1  
- **$0.20/noche** (o varias noches) → aprobar en World App → pagar  

## Stack

Next.js 16 · CDP x402 · World AgentBook / IDKit · Base Sepolia  

## Docs

Índice: [`docs/README.md`](./docs/README.md)
