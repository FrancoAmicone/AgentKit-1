# Docs — StayAgent

Documentación del proyecto **StayAgent**: un agente que busca alojamientos y paga la reserva onchain.

## Empezá acá

1. [07-stay-agent.md](./07-stay-agent.md) — producto, flujo, APIs, env, roadmap  
2. [06-checklist.md](./06-checklist.md) — checklist vivo (marcar al terminar cada tarea)  
3. Root [README.md](../README.md) — quickstart corto  

## Higiene

Al cerrar cualquier tarea o PR: actualizar **checklist** + doc de la fase afectada en el mismo cambio.

## Índice

| Doc | Contenido |
| --- | --- |
| [07-stay-agent.md](./07-stay-agent.md) | Spec + APIs + roadmap fases |
| [08-phase2-agentbook.md](./08-phase2-agentbook.md) | Phase 2A: gate AgentBook (payer only) |
| [09-phase2b-autopay-limit.md](./09-phase2b-autopay-limit.md) | Phase 2B: owner auto-pay limit |
| [06-checklist.md](./06-checklist.md) | Checklist de cuentas, código y pruebas |
| [04-coinbase-agentkit.md](./04-coinbase-agentkit.md) | CDP / AgentKit / x402 (Fase 1) |
| [02-world-agentkit.md](./02-world-agentkit.md) | World AgentKit (Fase 2) |
| [03-0g.md](./03-0g.md) | 0G Storage / Agentic ID (Fase 3) |
| [05-como-combinar.md](./05-como-combinar.md) | Cómo se combinan las piezas en StayAgent |
| [01-ideas.md](./01-ideas.md) | Histórico de ideas descartadas / previas |

## Estado del producto

| Fase | Descripción | Estado |
| --- | --- | --- |
| 1 | Catálogo mock + NLP + pago x402 (Base Sepolia) | **Hecha** |
| 2A | AgentBook gate + registro in-app (QR / deep link) | **Hecha** (demo wallet compartida) |
| 2B | Auto-pay limit (min $0.01, default $0.1) + modal Configurar | **Hecha** (código); validar bloqueo $0.2 |
| 2C | HITL si supera el tope | **Pendiente** |
| 3 | Recibos en 0G Storage | **Pendiente** |
| — | Multi-user: crear/registrar agente por persona | **Pendiente** |
| 4 | Discovery Bazaar / fuentes externas | Opcional |

## Enlaces oficiales

- CDP Portal: https://portal.cdp.coinbase.com  
- x402 buyers: https://docs.cdp.coinbase.com/x402/quickstart-for-buyers  
- x402 sellers: https://docs.cdp.coinbase.com/x402/quickstart-for-sellers  
- Coinbase AgentKit: https://docs.cdp.coinbase.com/agent-kit/welcome  
- World AgentKit: https://docs.world.org/agents/agent-kit/integrate  
- 0G: https://docs.0g.ai/  
