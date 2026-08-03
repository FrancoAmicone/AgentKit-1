# Checklist — qué tenés que hacer vos

Lista accionable. Marcá a medida que avances.

## Cuentas y apps

- [ ] Cuenta **Coinbase Developer Platform**: https://portal.cdp.coinbase.com
- [ ] Crear **CDP Secret API Key** (guardar id + secret offline)
- [ ] API key de **LLM** (OpenAI u otro compatible)
- [ ] Instalar **World App** en el teléfono (para register AgentBook)
- [ ] Wallet EVM (MetaMask/Rabby) para 0G Galileo y exploración
- [ ] (Opcional) App en https://developer.world.org si vas a usar Human-in-the-loop (`WORLD_RP_ID`, signing key, `app_id`)

## Redes y fondos testnet

### Base Sepolia (splits)

- [ ] Agregar Base Sepolia a la wallet / usar faucet CDP
- [ ] Tener ETH de test para gas
- [ ] Tener USDC de test (o empezar con native ETH transfers para simplificar)

### 0G Galileo (receipts / Agentic ID)

- [ ] Agregar red: RPC `https://evmrpc-testnet.0g.ai`, chainId `16602`
- [ ] Faucet: https://faucet.0g.ai
- [ ] Confirmar saldo en https://chainscan-galileo.0g.ai

## Setup World AgentKit

- [ ] `npm install @worldcoin/agentkit`
- [ ] Tener la address de la wallet del agente (CDP)
- [ ] `npx @worldcoin/agentkit-cli register <agent-address>`
- [ ] Completar verificación en World App (QR / deep link)
- [ ] `npx @worldcoin/agentkit-cli status <agent-address>` → registered

Docs: https://docs.world.org/agents/agent-kit/integrate

## Setup Coinbase AgentKit

- [ ] `npm create onchain-agent@latest` **o** integrar en este repo
- [ ] Completar `.env` con CDP + OpenAI + `NETWORK_ID=base-sepolia`
- [ ] Correr el agente / chatbot
- [ ] Pedirle un transfer de prueba y verificar en Basescan Sepolia

Docs: https://docs.cdp.coinbase.com/agent-kit/getting-started/quickstart

## Setup 0G Storage (Camino B+)

- [ ] Clonar o instalar starter: https://github.com/0gfoundation/0g-storage-ts-starter-kit
- [ ] Setear `PRIVATE_KEY` testnet + `NETWORK=testnet`
- [ ] Subir un JSON de prueba y anotar el root hash
- [ ] Definir schema del recibo HumanSplit (ver `04-0g.md`)

## Policy de seguridad (antes de mainnet)

- [ ] Allowlist de destinos del split
- [ ] Max amount por transacción
- [ ] Max amount diario
- [ ] Asset permitido (ej. solo USDC)
- [ ] Log de cada tool call + tx hash
- [ ] (Opcional) HITL World sobre umbral

## Definición de “MVP listo”

- [ ] Agente human-backed (AgentBook OK)
- [ ] Comando “repartí X con regla Y” funciona
- [ ] ≥ 2 transfers visibles en explorer
- [ ] Recibo generado (local o 0G)
- [ ] Docs de este folder leídas y camino elegido (`06-caminos.md`)

## Links rápidos

| Recurso | URL |
| --- | --- |
| World AgentKit integrate | https://docs.world.org/agents/agent-kit/integrate |
| World AgentKit GitHub | https://github.com/worldcoin/agentkit |
| World HITL | https://docs.world.org/agents/human-in-the-loop/integrate |
| 0G docs | https://docs.0g.ai/ |
| 0G testnet | https://docs.0g.ai/developer-hub/testnet/testnet-overview |
| 0G Agentic ID | https://docs.0g.ai/developer-hub/building-on-0g/agentic-id/overview |
| 0G Storage starter | https://github.com/0gfoundation/0g-storage-ts-starter-kit |
| Coinbase AgentKit | https://docs.cdp.coinbase.com/agent-kit/welcome |
| CDP Portal | https://portal.cdp.coinbase.com |
| AgentBook ecosystem | https://docs.world.org/agents/agent-kit/ecosystem |
