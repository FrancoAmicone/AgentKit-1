# Resumen — Coinbase AgentKit

**Links:** [Welcome](https://docs.cdp.coinbase.com/agent-kit/welcome) · [Quickstart](https://docs.cdp.coinbase.com/agent-kit/getting-started/quickstart) · [GitHub](https://github.com/coinbase/agentkit) · [CDP Portal](https://portal.cdp.coinbase.com)

## En una frase

Toolkit de Coinbase Developer Platform para que un agente tenga **wallet** y pueda hacer **acciones onchain** (transfers, swaps, contratos, etc.).

## Importante: no es el World AgentKit

Mismo nombre genérico (“AgentKit”), productos distintos:

| | World AgentKit | Coinbase AgentKit |
| --- | --- | --- |
| Foco | Humano detrás del agente | Ejecutar txs / wallet |
| Pieza clave | AgentBook + x402 | CDP SDK + action providers |

## Qué te brinda

| Capacidad | Detalle |
| --- | --- |
| Wallet providers | CDP non-custodial, Viem/local key, Privy, etc. |
| Action providers | Transfer, swap, deploy, NFT, custom actions |
| Frameworks | LangChain, Vercel AI SDK, Eliza, OpenAI Agents, MCP |
| Redes | EVM (Base, etc.) y Solana |
| DX | CLI `npm create onchain-agent@latest` |

También en el ecosistema CDP (relacionado, no obligatorio):

- **x402** — pagos HTTP para agentes/APIs
- **Agentic Wallet / Coinbase for Agents** — conectar flujos agenticos a Coinbase
- **Paymaster** — sponsorear gas

## Cómo funciona (alto nivel)

1. Creás proyecto con el CLI (o instalás `@coinbase/agentkit`).
2. Configurás API keys CDP (+ LLM si usás chat agent).
3. El LLM elige tools → el wallet provider firma → la tx va a la red (ej. Base Sepolia).

## Arranque

```bash
# TypeScript
npm create onchain-agent@latest

# Python
pipx run create-onchain-agent
```

Elegís framework, red (**Base Sepolia** para aprender) y wallet provider (**CDP** recomendado).

## Qué no hace solo

- No verifica “humano único” (World).
- No te da storage descentralizado de AI (0G).
- Sin **policy** (límites, allowlists), un agente con fondos es riesgoso.

## Cuándo tiene sentido

- Querés **txs reales** con buena DX en Base.
- Querés un chatbot/agente que mueva tokens sin armar todo de viem a mano.
- Querés extender actions (Aave, split custom, etc.).

## Cuándo no hace falta

- Solo estás haciendo verificación World / x402 sin mover fondos.
- Preferís firmar vos con una wallet manual y el “agente” solo decide offchain.
- Todo vive 100% en otra chain y ya tenés otro SDK cómodo.

## Setup mínimo (si lo elegimos)

1. Cuenta en https://portal.cdp.coinbase.com
2. Secret API Key
3. API key de LLM (si hay chat)
4. `NETWORK_ID=base-sepolia` y primer transfer de prueba
