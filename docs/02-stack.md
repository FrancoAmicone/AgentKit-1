# Stack sugerido

## Diagrama mental

```
┌─────────────────────────────────────────────────────────┐
│  VOS (humano único, World ID)                           │
│    ↓ registra wallet del agente                         │
│  AgentBook (World Chain)                                │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│  AGENTE (LLM + tools)                                   │
│                                                         │
│  World AgentKit client  → prueba "soy human-backed"     │
│  Coinbase AgentKit      → firma y manda txs (Base)      │
│  0G Storage (opcional)  → guarda recibos / memoria      │
│  0G Agentic ID (fase 2) → tokeniza el agente            │
└─────────────────────────────────────────────────────────┘
```

## Piezas y para qué sirven

| Pieza | Qué es | Para qué la usamos | ¿Obligatoria en MVP? |
| --- | --- | --- | --- |
| **World AgentKit** (`@worldcoin/agentkit`) | Prueba que hay un humano World ID detrás de la wallet del agente | Confianza / anti-spam / free-trial en APIs x402 | **Sí** (núcleo de la idea) |
| **World App** | App móvil para verificar World ID al registrar | Completar `npx @worldcoin/agentkit-cli register` | **Sí** (una vez) |
| **Coinbase AgentKit** (`@coinbase/agentkit`) | Toolkit CDP: wallet + actions onchain | Ejecutar splits (transfers USDC) en Base | **Sí** si querés txs “reales” con DX buena |
| **Base (Sepolia → Mainnet)** | L2 de Coinbase | Cadena de ejecución de pagos | **Sí** |
| **LLM** (OpenAI u otro) | Cerebro del agente | Interpretar “repartí 100 USDC” y elegir tools | Sí para modo chat; no si es script puro |
| **0G Chain (Galileo testnet)** | L1/L2 AI-centric EVM | Deploy Agentic ID / ops baratas | Fase 2 |
| **0G Storage** | Storage descentralizado | Recibos, reglas, memoria del agente | Fase 1.5 (recomendado) |
| **0G Compute** | Inference descentralizada | Correr el LLM en 0G en vez de OpenAI | Opcional / aprendizaje |
| **x402** | Pagos HTTP 402 | Cobrar por usar el agente / dar free-trial a human-backed | Fase 2 (o MVP si elegís variante B) |

## Cómo se conectan (sin mezclar responsabilidades)

1. **World** no mueve tu USDC del split. Solo responde: “esta wallet de agente está ligada a un humano anónimo único”.
2. **Coinbase/Base** mueve la plata.
3. **0G** guarda evidencia o identidad del agente; no reemplaza World ni CDP en el MVP.

## Alternativas dentro del stack

### Wallet del agente

| Opción | Pros | Contras |
| --- | --- | --- |
| **CDP Non-Custodial** (Coinbase) | Setup fácil, faucet testnet, smart wallets | Dependés de CDP API keys |
| **Viem / clave local** | Control total | Más riesgo; vos custodiás la key |
| **Privy** | Bueno si hay UI multi-user | Más superficie de producto |

Recomendado MVP: **CDP + Base Sepolia**.

### Cerebro del agente

| Opción | Pros | Contras |
| --- | --- | --- |
| **LangChain + AgentKit** | Muchos ejemplos Coinbase | Más deps |
| **Script sin LLM** | Más simple, determinista | Menos “agente”, más cronjob |
| **0G Compute** | On-stack 0G | Más setup; útil después |

Recomendado para aprender: **LangChain chatbot** que llama tools de split.  
Si querés máxima claridad onchain primero: **script determinista** + después le ponés LLM.

### Cadena de pagos

| Opción | Cuándo |
| --- | --- |
| **Base Sepolia** | Aprender y probar (recomendado) |
| **Base mainnet** | Montos chicos reales |
| **World Chain** | Si querés pagos USDC nativos World + x402 World facilitator |
| **0G Galileo** | Si el valor está en Agentic ID / storage, no en DeFi Base |

World AgentKit acepta pagos x402 en **World Chain y Base**. AgentBook siempre se resuelve en World Chain.

## Paquetes npm principales (referencia)

```bash
# World — humano detrás del agente
npm install @worldcoin/agentkit
npx @worldcoin/agentkit-cli register <agent-address>

# Coinbase — txs onchain
npm create onchain-agent@latest
# o en proyecto existente:
npm install @coinbase/agentkit @coinbase/agentkit-langchain

# 0G Storage (fase 1.5+)
npm install @0gfoundation/0g-storage-ts-sdk
# o starter kit: https://github.com/0gfoundation/0g-storage-ts-starter-kit
```

## Variables de entorno (vista previa)

```bash
# LLM
OPENAI_API_KEY=

# Coinbase CDP
CDP_API_KEY_ID=
CDP_API_KEY_SECRET=
NETWORK_ID=base-sepolia

# World (si usás human-in-the-loop además de AgentBook)
WORLD_RP_ID=
WORLD_SIGNING_KEY=
NEXT_PUBLIC_WORLD_APP_ID=

# 0G
ZG_PRIVATE_KEY=
ZG_RPC_URL=https://evmrpc-testnet.0g.ai
ZG_INDEXER=https://indexer-storage-testnet-turbo.0g.ai
```

Detalle por pieza en los docs `03`, `04`, `05` y checklist en `07`.
