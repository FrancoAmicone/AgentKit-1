# Resumen — World AgentKit

**Links:** [Docs integrate](https://docs.world.org/agents/agent-kit/integrate) · [SDK reference](https://docs.world.org/agents/agent-kit/sdk-reference) · [GitHub](https://github.com/worldcoin/agentkit)

## En una frase

Prueba que un **agente está respaldado por un humano único** (World ID), sin revelar quién es.

## Qué problema ataca

Bots y scripts pueden spamear APIs, free trials, claims y bounties. World AgentKit deja distinguir **automatización con humano detrás** vs **bot suelto**.

## Cómo funciona (alto nivel)

1. Registrás la wallet del agente en **AgentBook** con una prueba World ID (`npx @worldcoin/agentkit-cli register <address>`).
2. Un server/API (sobre **x402**) desafía al agente a firmar un mensaje.
3. Verifica la firma, resuelve el humano anónimo en AgentBook y aplica política:
   - `free` — pasa sin pagar
   - `free-trial` — N usos gratis
   - `discount` — paga menos
   - si no califica → pago x402 normal

AgentBook se resuelve en **World Chain**. El agente puede firmar desde Base u otras EVM.

## Qué te brinda

| Capacidad | Detalle |
| --- | --- |
| Identidad human-backed | Wallet ↔ humano anónimo único |
| Anti-spam en APIs | Free trial / descuento solo a agentes verificados |
| Cliente HTTP | `createAgentkitClient` + `agentkit.fetch` |
| Server hooks | Integración con x402 (Hono de referencia; también Express/Next) |
| Pagos x402 | Ejemplos en World Chain y Base |

## Extra relacionado (otro paquete)

**Human-in-the-loop** (`@worldcoin/human-in-the-loop`): el agente **pausa** y pide aprobación World ID antes de una acción sensible.  
No es lo mismo que AgentBook; es “aprobá *esta* acción”, no solo “hay un humano detrás del agente”.

Docs: https://docs.world.org/agents/human-in-the-loop/integrate

## Qué no hace

- No es un framework DeFi completo.
- No reemplaza wallets/transfers tipo Coinbase AgentKit.
- No es storage ni compute (eso sería 0G u otro).

## Cuándo tiene sentido usarlo

- Claims, rifas, bounties, APIs: **1 humano = 1 derecho**.
- Querés monetizar agentes (x402) sin regalar todo a bots.
- Querés accountability mínima sobre quién opera el agente.

## Cuándo no hace falta

- Script personal solo tuyo, sin audiencia ni abuso posible.
- Solo estás aprendiendo a firmar una tx y no hay superficie pública.

## Setup mínimo (si lo elegimos)

```bash
npm install @worldcoin/agentkit
npx @worldcoin/agentkit-cli register <agent-address>
npx @worldcoin/agentkit-cli status <agent-address>
```

Necesitás **World App** en el teléfono para completar el register.
