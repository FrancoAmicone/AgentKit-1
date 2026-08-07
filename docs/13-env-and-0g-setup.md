# Env vars (Vercel) + setup 0G Storage (official)

What to load in **Vercel** and how to prepare **0G Storage** using the official Builder Hub / docs.

**Sources we follow**

- https://build.0g.ai/storage  
- https://docs.0g.ai/developer-hub/building-on-0g/storage/sdk  
- Package: `@0gfoundation/0g-storage-ts-sdk`  
- Faucet: https://faucet.0g.ai  
- Verify uploads: https://storagescan.0g.ai  

We use **0G Storage only** (receipts). **Not** 0G Compute.

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

Opcionales:

```bash
# WORLD_ID_APP_ID=app_a7c3e2b6b83927251a0db5345bd7146a
# DEFAULT_AUTO_PAY_LIMIT_USDC=0.1
# DEMO_SHARED_AGENT=true   # solo emergencia (payer compartido)
# BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
```

---

## 2. Multi-user

Cada visitante crea su wallet CDP (`POST /api/agent/create`). No hace falta `AGENT_WALLET_ADDRESS` por usuario.

Marketplace sigue siendo una sola address (`MARKETPLACE_WALLET_ADDRESS`).

---

## 3. 0G Storage — variables (oficial)

| Variable | ¿Obligatoria para recibos? | Valor |
| --- | --- | --- |
| `OG_PRIVATE_KEY` | Sí | `0x…` — misma idea que `PRIVATE_KEY` en el starter kit oficial |
| `OG_NETWORK` | No | `testnet` (default) o `mainnet` |
| `OG_STORAGE_MODE` | No | `turbo` (default) o `standard` |
| `OG_EVM_RPC` | No | Override RPC (default testnet: `https://evmrpc-testnet.0g.ai`) |
| `OG_INDEXER_RPC` | No | Override indexer (default turbo testnet: `https://indexer-storage-testnet-turbo.0g.ai`) |

Si **no** ponés `OG_PRIVATE_KEY`, la reserva **igual funciona**; el recibo se omite (`skipped`).

Endpoints oficiales (Builder Hub / starter kit):

| | Testnet (Galileo) | Mainnet |
| --- | --- | --- |
| RPC | `https://evmrpc-testnet.0g.ai` | `https://evmrpc.0g.ai` |
| Chain ID | `16602` | `16661` |
| Indexer turbo | `https://indexer-storage-testnet-turbo.0g.ai` | `https://indexer-storage-turbo.0g.ai` |
| Explorer | https://chainscan-galileo.0g.ai | https://chainscan.0g.ai |
| Storage Scan | https://storagescan.0g.ai | https://storagescan.0g.ai |

Implementación: `lib/og-storage.ts` → `Indexer` + `MemData` + `ethers.Wallet` (mismo flujo que https://build.0g.ai/storage pasos 01–06).

---

## 4. Cómo preparar 0G en la web (paso a paso)

### 4.1 Wallet + private key

1. MetaMask → cuenta nueva (solo para uploads 0G).  
2. Account details → **Show private key**.  
3. Esa key → `OG_PRIVATE_KEY` en Vercel (con `0x`).

### 4.2 Red Galileo en MetaMask

| Campo | Valor |
| --- | --- |
| Network name | `0G Galileo Testnet` |
| RPC URL | `https://evmrpc-testnet.0g.ai` |
| Chain ID | `16602` |
| Currency | `0G` |
| Explorer | `https://chainscan-galileo.0g.ai` |

Overview: https://docs.0g.ai/developer-hub/testnet/testnet-overview

### 4.3 Faucet (Builder Hub step 02)

1. Abrí **https://faucet.0g.ai**  
2. Pedí tokens a tu address Galileo.  
3. Confirmá saldo en MetaMask / chainscan.

### 4.4 (Opcional) Probar sin StayAgent

- UI sin código: Storage Scan Tool en https://build.0g.ai/storage  
- O starter kit: https://github.com/0gfoundation/0g-storage-ts-starter-kit  

```bash
npm install @0gfoundation/0g-storage-ts-sdk ethers
# PRIVATE_KEY=0x…  NETWORK=testnet  STORAGE_MODE=turbo
```

### 4.5 Cargar en Vercel y redeploy

```bash
OG_PRIVATE_KEY=0x…
OG_NETWORK=testnet
OG_STORAGE_MODE=turbo
```

Environment: Production + Preview → **Redeploy**.

### 4.6 Verificar un recibo (Builder Hub step 06)

1. Reservá en StayAgent.  
2. En “Reserva confirmada” copiá el **root hash** / link Storage Scan.  
3. Abrí **https://storagescan.0g.ai** y buscá el root hash.

---

## 5. Fondear el agente (Base Sepolia) — aparte de 0G

1. Configurar → Crear mi agente → copiar address.  
2. Enviar **USDC** en **Base Sepolia** a esa address.  
3. Contract: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`  
4. Actualizar saldo en la UI.

---

## 6. Checklist Vercel

```bash
CDP_API_KEY_ID=…
CDP_API_KEY_SECRET=…
CDP_WALLET_SECRET=…
MARKETPLACE_WALLET_ADDRESS=0x…
CDP_X402_CLIENT_ENVIRONMENT=development
REQUIRE_HUMAN_BACKED_AGENT=true

OG_PRIVATE_KEY=0x…
OG_NETWORK=testnet
OG_STORAGE_MODE=turbo
```
