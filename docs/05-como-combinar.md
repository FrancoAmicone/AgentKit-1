# Cómo se combinan las piezas en StayAgent

No hace falta usar World + 0G + Coinbase juntos desde el día 1. StayAgent suma capas por fase.

## Mapa por fase

| Fase | Pieza activa | Pregunta que responde | Estado |
| --- | --- | --- | --- |
| **1** | CDP + x402 (Base Sepolia) | ¿El agente puede pagar una reserva de verdad (testnet)? | **Hecha** |
| **2A/2B** | + World AgentBook + tope auto-pay | ¿Hay un humano dueño del agente? ¿Hasta cuánto paga solo? | **Hecha** |
| **2C** | + World HITL | ¿El humano aprueba este gasto alto? | Pendiente |
| **3** | + 0G Storage | ¿Queda un recibo auditable fuera del server? | Pendiente |
| **4** | + Bazaar / APIs externas | ¿De dónde salen listings reales? | Opcional |

## Fase 1

**Coinbase CDP + x402**: wallet del agente paga → `/buy` cobra → facilitator settle.

## Fase 2 — World (parcialmente hecha)

- **2A:** AgentBook en purchase (payer only) + registro in-app.  
- **2B:** tope de pago automático.  
- **2C (pendiente):** aprobación humana si supera el tope.  

World no mueve el USDC; condiciona *quién* puede gastar y *cuándo*.

## Fase 3 — 0G

Evidencia del pago más allá de logs locales / Agentic ID más adelante.  
No reemplaza Base/CDP para settlement USDC.

## Regla práctica

> Primero pago testnet end-to-end → identidad AgentBook → tope → HITL → recibos 0G.

Detalle: [07-stay-agent.md](./07-stay-agent.md) · checklist [06](./06-checklist.md).  
Resúmenes: [04](./04-coinbase-agentkit.md) · [02](./02-world-agentkit.md) · [03](./03-0g.md).
