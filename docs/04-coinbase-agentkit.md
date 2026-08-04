# Resumen — Coinbase CDP / AgentKit / x402

**Links:** [AgentKit](https://docs.cdp.coinbase.com/agent-kit/welcome) · [x402 buyers](https://docs.cdp.coinbase.com/x402/quickstart-for-buyers) · [x402 sellers](https://docs.cdp.coinbase.com/x402/quickstart-for-sellers) · [Portal](https://portal.cdp.coinbase.com) · [GitHub AgentKit](https://github.com/coinbase/agentkit)

## En una frase

Infra de Coinbase para que un agente tenga **wallet** y pueda **pagar / cobrar onchain**, en este proyecto vía **x402** en Base Sepolia.

## Cómo lo usa StayAgent (Fase 1)

| Componente | Uso concreto |
| --- | --- |
| `CdpClient` | `npm run setup:wallets` crea payer + receiver |
| `CdpX402Client` | Wallet del agente firma pagos x402 (`lib/agent-payer.ts`) |
| `createCdpFacilitatorClient` | Facilitator autenticado CDP (`lib/x402-server.ts`) |
| `@x402/next` `withX402` | Protege `POST /api/listings/[id]/buy` |
| `@x402/fetch` | El agente hace el ciclo 402 → pagar → reintentar |
| `@coinbase/agentkit` | Instalado; el flujo de pago actual usa CDP x402 directo (más simple para este caso) |

## AgentKit vs CDP x402 (importante)

| | Coinbase AgentKit | CDP x402 (`CdpX402Client`) |
| --- | --- | --- |
| Foco | Tools onchain para LLMs (transfer, swap, …) | Pagar endpoints HTTP 402 |
| StayAgent Fase 1 | Disponible / futuro | **Sí — path principal del pago** |

No confundir con **World** AgentKit (humano detrás del agente).

## Red

- Testnet: **Base Sepolia** (`eip155:84532`)  
- Env: `CDP_X402_CLIENT_ENVIRONMENT=development`  
- Asset: USDC testnet (faucet CDP)

## Qué tenés que crear en CDP

1. Cuenta en el portal  
2. API Key ID + Secret  
3. Wallet Secret  
4. Correr `npm run setup:wallets` en este repo  

## Cuándo ampliar con AgentKit “clásico”

Si más adelante el agente necesita tools tipo “transferí residual”, “swapeá ETH→USDC”, o un loop LangChain más rico, sumás action providers de `@coinbase/agentkit` encima de la misma cuenta CDP.
