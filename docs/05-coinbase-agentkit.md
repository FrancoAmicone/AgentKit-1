# Coinbase AgentKit — transacciones onchain

Docs: https://docs.cdp.coinbase.com/agent-kit/welcome  
Quickstart: https://docs.cdp.coinbase.com/agent-kit/getting-started/quickstart  
Repo: https://github.com/coinbase/agentkit

## Qué es

Toolkit de Coinbase Developer Platform (CDP) para que un agente tenga **wallet** y **actions onchain** (transfer, swap, deploy, etc.). Framework-agnostic (LangChain, Vercel AI SDK, MCP, …).

Esto es lo que usamos para **mover USDC de verdad** en Base.

## Arranque rápido

### TypeScript (recomendado)

```bash
npm create onchain-agent@latest
cd onchain-agent
# completar .env.local → .env (CDP + OpenAI)
npm install
npm run dev
```

Durante el CLI elegís:

1. Framework (LangChain / Vercel AI SDK / MCP)
2. Network (**Base Sepolia** para aprender)
3. Wallet provider (**CDP Non-Custodial** recomendado)

### Python

```bash
pipx run create-onchain-agent
```

## Qué tenés que crear vos en CDP

1. Cuenta en https://portal.cdp.coinbase.com
2. **Secret API Key** (id + secret/private key)
3. (Opcional) faucet de testnet desde el portal / tools del agente

Env típico:

```bash
CDP_API_KEY_ID=...
CDP_API_KEY_SECRET=...
# o el naming que genere el scaffold (.env.local)
OPENAI_API_KEY=...
NETWORK_ID=base-sepolia
```

## Actions que nos importan para HumanSplit

| Action | Uso |
| --- | --- |
| Get wallet address / balance | Ver fondos antes de repartir |
| Native transfer / ERC20 transfer | Mandar USDC a savings / spend / partner |
| (Opcional) Swap | Convertir ETH→USDC antes del split |
| Custom action provider | Encapsular `split_payment(amount, rule)` como una sola tool |

Para aprender, empezá con **transfers**. Después envolvés la lógica de % en un action provider custom.

## Esqueleto conceptual (LangChain)

```ts
import { AgentKit } from '@coinbase/agentkit'
import { getLangChainTools } from '@coinbase/agentkit-langchain'
import { createReactAgent } from '@langchain/langgraph/prebuilt'
import { ChatOpenAI } from '@langchain/openai'

const agentKit = await AgentKit.from({
  // credenciales CDP / wallet provider según scaffold actual
})

const tools = await getLangChainTools(agentKit)
const agent = createReactAgent({
  llm: new ChatOpenAI({ model: 'gpt-4o-mini' }),
  tools,
})

// Prompt del usuario: "Reparte 10 USDC 70/20/10 a A/B/C"
```

## Policy (obligatorio si hay plata real)

Aunque el LLM “quiera”, el código debe imponer:

- Allowlist de destinos
- Asset permitido (USDC)
- Max amount por tx / por día
- (Opcional) HITL World si supera umbral

Sin policy, un agente con wallet es un bug con gas money.

## Cómo se combina con World

| Paso | Quién |
| --- | --- |
| Registrar address del agente en AgentBook | World CLI |
| Misma address firma txs de split | Coinbase / CDP wallet |
| Server exige human-backed antes de aceptar órdenes | World hooks |
| Ejecutar transfers | Coinbase AgentKit |

Ideal: **una sola address de agente** usada en ambos mundos.

## Testnet vs mainnet

| Red | Cuándo |
| --- | --- |
| `base-sepolia` | Todo el aprendizaje y demos |
| `base-mainnet` | Cuando la policy esté testeada; montos chicos |

## Generators útiles del CLI

```bash
agentkit generate action-provider   # tool custom (ej. split)
agentkit generate wallet-provider
agentkit generate create-agent
```
