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
| [10-phase2c-hitl.md](./10-phase2c-hitl.md) | Phase 2C: human approval over tope |
| [11-demo-tradeoffs.md](./11-demo-tradeoffs.md) | Atajos conscientes del demo (no “bugs”) |
| [12-multiuser-and-0g.md](./12-multiuser-and-0g.md) | Design: wallet por usuario + recibos 0G |
| [06-checklist.md](./06-checklist.md) | Checklist de cuentas, código y pruebas |
| [04-coinbase-agentkit.md](./04-coinbase-agentkit.md) | CDP / AgentKit / x402 (Fase 1) |
| [02-world-agentkit.md](./02-world-agentkit.md) | World AgentKit (Fase 2) |
| [03-0g.md](./03-0g.md) | 0G Storage / Agentic ID (Fase 3) |
| [05-como-combinar.md](./05-como-combinar.md) | Cómo se combinan las piezas |
| [01-ideas.md](./01-ideas.md) | Histórico de ideas |

## Estado del producto

| Fase | Descripción | Estado |
| --- | --- | --- |
| 1 | Catálogo mock + NLP + pago x402 (Base Sepolia) | **Hecha** |
| 2A | AgentBook gate + registro in-app | **Hecha** |
| 2B | Auto-pay limit + modal Configurar | **Hecha** |
| 2C | HITL si supera el tope | **Hecha** (código); validar en prod |
| — | Multi-user (wallet + agente propios) | **Design** → [12](./12-multiuser-and-0g.md) |
| 3 | Recibos en 0G Storage | **Design** → [12](./12-multiuser-and-0g.md) |
| 4 | Discovery | Opcional |
