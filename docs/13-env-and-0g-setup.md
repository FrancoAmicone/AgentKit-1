# Env vars (Vercel) + setup 0G (Galileo)

What to load in **Vercel** (Project → Settings → Environment Variables) and how to prepare **0G** on the web.

---

## 1. Variables que ya tenías (CDP + StayAgent)

| Variable | ¿Obligatoria? | Dónde sale |
| --- | --- | --- |
| `CDP_API_KEY_ID` | Sí | [CDP Portal](https://portal.cdp.coinbase.com) → API Keys |
| `CDP_API_KEY_SECRET` | Sí | Idem |
| `CDP_WALLET_SECRET` | Sí | CDP Portal → Wallet Secret |
| `MARKETPLACE_WALLET_ADDRESS` | Sí | `npm run setup:wallets` (receiver) |
| `CDP_X402_CLIENT_ENVIRONMENT` | Recomendada | `development` (= Base Sepolia) |
| `REQUIRE_HUMAN_BACKED_AGENT` | Recomendada | `true` |
| `AGENT_WALLET_ADDRESS` | Opcional ahora | Solo si usás demo compartido (abajo) |

Opcionales que ya existían:

```bash
# WORLD_ID_APP_ID=app_a7c3e2b6b83927251a0db5345bd7146a
# DEFAULT_AUTO_PAY_LIMIT_USDC=0.1
# AGENTBOOK_RELAY_URL=https://x402-worldchain.vercel.app
# OPENAI_API_KEY=
```

---

## 2. Nuevas variables — multi-user

| Variable | Default | Qué hace |
| --- | --- | --- |
| `DEMO_SHARED_AGENT` | unset / `false` | Si `true`, vuelve al payer compartido `stay-agent-payer` (solo demos de emergencia). **Dejálo apagado** en prod multi-user. |
| `BASE_SEPOLIA_RPC_URL` | `https://sepolia.base.org` | RPC para leer saldo USDC/ETH del agente |

Cada visitante crea su propia wallet CDP vía `POST /api/agent/create` (cookie httpOnly). **No hace falta** una `AGENT_WALLET_ADDRESS` fija por usuario.

Marketplace sigue siendo una sola address (`MARKETPLACE_WALLET_ADDRESS`) que recibe el USDC.

---

## 3. Nuevas variables — 0G Storage (recibos)

| Variable | ¿Obligatoria para 0G? | Valor tipico |
| --- | --- | --- |
| `OG_PRIVATE_KEY` | Sí (para subir recibos) | `0x…` private key de una wallet con gas en **0G Galileo** |
| `OG_EVM_RPC` | No | `https://evmrpc-testnet.0g.ai` |
| `OG_INDEXER_RPC` | No | `https://indexer-storage-testnet-turbo.0g.ai` |

Si **no** ponés `OG_PRIVATE_KEY`, la reserva **igual funciona**; el recibo 0G se omite (`skipped`) y la UI lo indica.

**Importante:** esta key solo paga gas en 0G para subir el JSON del recibo. **No** es la wallet del agente ni la del marketplace. Preferí una wallet chica solo para uploads.

---

## 4. Cómo preparar 0G en la web (paso a paso)

### 4.1 Crear / usar una wallet

1. Abrí MetaMask (u otra wallet).
2. Creá una cuenta nueva (recomendado: solo para 0G testnet).
3. Copiá la **address** y exportá la **private key** (MetaMask → Account details → Show private key).  
   Esa private key va en Vercel como `OG_PRIVATE_KEY` (con `0x` al inicio).

### 4.2 Agregar red Galileo (0G testnet)

En MetaMask → Networks → Add network → Add a network manually:

| Campo | Valor |
| --- | --- |
| Network name | `0G Galileo Testnet` |
| RPC URL | `https://evmrpc-testnet.0g.ai` |
| Chain ID | `16602` |
| Currency symbol | `0G` |
| Block explorer | `https://chainscan-galileo.0g.ai` |

Docs: https://docs.0g.ai/developer-hub/testnet/testnet-overview

### 4.3 Pedir tokens en el faucet

1. Andá a **https://faucet.0g.ai**
2. Conectá / pegá tu address de Galileo.
3. Pedí tokens de testnet (gas para uploads).
4. Verificá el saldo en MetaMask (red Galileo) o en https://chainscan-galileo.0g.ai

### 4.4 Cargar la key en Vercel (“Augie”)

1. Vercel → tu proyecto StayAgent → **Settings** → **Environment Variables**
2. Add:
   - `OG_PRIVATE_KEY` = `0x…` (Production + Preview)
   - (opcional) `OG_EVM_RPC`, `OG_INDEXER_RPC` si querés override
3. **Redeploy** el proyecto para que tome las vars.

### 4.5 Verificar

1. En la app: crear agente → fondear USDC Base Sepolia → World → tope → reservar.
2. En “Reserva confirmada” deberías ver **Recibo 0G** con `rootHash`.
3. Si falla el upload, la reserva sigue OK y verás “recibo 0G pendiente”.

Starter kit oficial (opcional, para probar uploads a mano):  
https://github.com/0gfoundation/0g-storage-ts-starter-kit

---

## 5. Cómo fondear el agente del usuario (Base Sepolia)

Esto es **aparte** de 0G:

1. En Configurar → **Crear mi agente** → copiá la address.
2. Enviá **USDC** en red **Base Sepolia** a esa address (desde MetaMask u otra wallet).
3. USDC contract Base Sepolia: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
4. Faucet USDC: [CDP Portal](https://portal.cdp.coinbase.com) (o el que uses).
5. Faucet ETH (gas): faucet de Base Sepolia.
6. Tocá **Actualizar saldo** hasta ver ≥ ~$0.05 USDC.

Al crear el agente, StayAgent intenta faucet CDP automático (ETH + USDC); a veces rate-limit — por eso existe el paso manual.

---

## 6. Checklist rápido Vercel

```bash
# Ya existentes
CDP_API_KEY_ID=…
CDP_API_KEY_SECRET=…
CDP_WALLET_SECRET=…
MARKETPLACE_WALLET_ADDRESS=0x…
CDP_X402_CLIENT_ENVIRONMENT=development
REQUIRE_HUMAN_BACKED_AGENT=true

# Multi-user (recomendado: NO poner DEMO_SHARED_AGENT)
# DEMO_SHARED_AGENT=false

# 0G receipts
OG_PRIVATE_KEY=0x…
# OG_EVM_RPC=https://evmrpc-testnet.0g.ai
# OG_INDEXER_RPC=https://indexer-storage-testnet-turbo.0g.ai
```

Después de guardar vars → **Redeploy**.
