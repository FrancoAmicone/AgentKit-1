# Cómo se combinan las piezas en StayAgent

No hace falta usar World + 0G + Coinbase juntos desde el día 1. StayAgent suma capas por fase.

## Mapa por fase

| Fase | Pieza activa | Pregunta que responde |
| --- | --- | --- |
| **1** | CDP + x402 (Base Sepolia) | ¿El agente puede pagar una reserva de verdad (testnet)? |
| **2** | + World AgentKit / World ID | ¿Hay un humano verificable dueño del agente / del gasto alto? |
| **3** | + 0G Storage | ¿Queda un recibo auditable fuera del server? |
| **4** | + Bazaar / APIs externas | ¿De dónde salen listings reales? |

## Fase 1 (actual)

Solo **Coinbase CDP + x402**:

- Wallet del agente paga  
- Endpoint `/buy` cobra  
- Facilitator CDP verifica/settle  

World y 0G **afuera** a propósito.

## Fase 2 — sumar World

Tiene sentido cuando:

- Querés limitar gasto hasta verificar humano  
- Querés free-trial / anti-spam si exponés APIs públicas  
- Querés accountability del operador del agente  

No reemplaza el pago: World no mueve el USDC de la reserva.

## Fase 3 — sumar 0G

Tiene sentido cuando:

- Querés evidencia del pago más allá de los logs locales  
- Más adelante tokenizás el agente (Agentic ID)  

No reemplaza Base/CDP para el settlement USDC del MVP.

## Regla práctica

> Primero un pago testnet end-to-end. Recién ahí identidad (World) y auditoría (0G).

Detalle de producto: [07-stay-agent.md](./07-stay-agent.md).  
Resúmenes: [04](./04-coinbase-agentkit.md) · [02](./02-world-agentkit.md) · [03](./03-0g.md).
