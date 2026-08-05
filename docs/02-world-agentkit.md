# Resumen — World AgentKit

**Links:** [Docs integrate](https://docs.world.org/agents/agent-kit/integrate) · [SDK reference](https://docs.world.org/agents/agent-kit/sdk-reference) · [GitHub](https://github.com/worldcoin/agentkit)

## En una frase

Prueba que un **agente está respaldado por un humano único** (World ID), sin revelar quién es.

## Rol en StayAgent

| Pieza | Estado |
| --- | --- |
| AgentBook + registro in-app (2A) | **Hecho** → [08](./08-phase2-agentbook.md) |
| Auto-pay tope (2B) | **Hecho** → [09](./09-phase2b-autopay-limit.md) |
| HITL gasto alto (2C) | **Hecho** → [10](./10-phase2c-hitl.md) |

StayAgent usa un HITL *lean* (World Bridge + token one-time), no el paquete Workflow/AI SDK completo.

## Cómo funciona (alto nivel AgentKit)

1. Registrás la wallet del agente en **AgentBook** con World ID.  
2. Un server puede resolver `lookupHuman(address)`.  
3. Políticas free / free-trial / discount sobre x402 (opcional; StayAgent usa gate + tope + HITL propio).

## Extra: paquete oficial HITL

`@worldcoin/human-in-the-loop` pausa workflows AI/Workflow SDK.  
Docs: https://docs.world.org/agents/human-in-the-loop/integrate  

## Setup registro (StayAgent)

UI → **Configurar** → **Registrar con World App**, o CLI:

```bash
npx @worldcoin/agentkit-cli register <agent-address>
npx @worldcoin/agentkit-cli status <agent-address>
```
