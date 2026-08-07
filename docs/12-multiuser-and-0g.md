# Design — Multi-user agents + Phase 3 (0G Storage)

**Status: implemented (multi-user session + 0G soft-fail uploads).**  
Ops remaining: set `OG_PRIVATE_KEY` on Vercel — see [13-env-and-0g-setup.md](./13-env-and-0g-setup.md).

## Decision (confirmed)

Each person must have **their own agent** and **their own wallet**.

We stop using the shared demo payer (`stay-agent-payer` / single `AGENT_WALLET_ADDRESS`) as the product model. That shared wallet stays only as a fallback for local/dev demos until multi-user ships.

| Today (demo) | Target |
| --- | --- |
| One CDP account for everyone | One CDP (or equivalent) wallet **per user** |
| One AgentBook registration for that address | User registers **their** address with World |
| One global auto-pay tope | Tope stored **per agent address** (already keyed that way in `lib/agent-limits.ts`) |
| HITL binds to the shared agent | HITL binds to **the user’s** agent + listing + amount |
| No durable receipt | After pay → JSON receipt on **0G Storage** + hash in UI |

**0G is not where the agent runs.** The agent still runs in StayAgent (Next.js) and pays on **Base Sepolia** via CDP + x402. 0G Storage is the **audit trail** after a successful reserve.

---

## End-to-end flow (inside the app)

One setup wizard (Configurar), then normal search → reserve.

```
1. Open StayAgent → tap Configurar (or auto-open if no agent)
2. Step “Crear agente”
      → POST /api/agent/create
      → CDP getOrCreateAccount for this session
      → show agent address
3. Step “Cargar fondos” (simple fund UI)
      → show address + QR + Copy
      → optional “Abrir faucet” links (Base Sepolia ETH / USDC)
      → poll balance until USDC > 0 (and gas if needed)
      → user can send from MetaMask to this address (funding only)
4. Step “Verificar con World”
      → existing AgentBook QR / Abrir World App (scoped to this address)
5. Step “Tope automático”
      → save auto-pay limit for this agent (e.g. $0.1)
6. Setup complete → search listings → Reservar
      ├─ price ≤ tope + funded + registered → agent auto-pays (x402)
      └─ price > tope → World HITL → then this agent pays
7. Payment USDC goes to marketplace wallet (x402), not to 0G
8. After success → upload receipt JSON to 0G Storage
9. UI “Reserva confirmada” → tx link + 0G content hash
```

**Money vs receipt:** USDC settlement stays on Base (marketplace receives pay). **0G stores the receipt** (proof/audit), it does not receive the payment.

Identity for “who is this browser user?” — see Open questions. Default first slice: anonymous session cookie → one agent per device/browser.

---

## UX: setup wizard (keep it simple)

Single modal / panel with a short checklist. User only advances when the step is done.

| Step | What the user sees | Done when |
| --- | --- | --- |
| 1. Crear agente | One button “Crear mi agente” → then show address | CDP account exists for session |
| 2. Cargar fondos | Address (mono), **Copy**, **QR**, “Enviá USDC (Base Sepolia) acá”, faucet links, live balance | USDC balance ≥ small minimum (e.g. $0.05) |
| 3. World | Same register panel as today (one Abrir World App + QR) | AgentBook `registered` |
| 4. Tope | Number input + Guardar (min $0.01, default $0.1) | Limit saved for this address |

Funding UX principles:

- No seed phrases, no MetaMask “connect as agent.”
- MetaMask (or any wallet) is only “send USDC **to** this address.”
- Big Copy + QR; short network warning: **Base Sepolia**, asset **USDC**.
- “Ya envié — actualizar saldo” button + light auto-poll.
- Don’t block the whole app: user can close and reopen Configurar; progress persists on the session.

After setup, home stays as today: search → cards → Reservar. Badge shows Human-backed + short address + tope.

---

## Phase A — Multi-user (own wallet + own agent)

### Product requirements

1. **Create agent wallet** — API creates a named CDP account per user (e.g. `stay-agent-{userId}` or a random unique name) and returns the address.
2. **Session binding** — subsequent `status` / `limits` / `register` / `purchase` / `approve/*` use **that** address, not `stay-agent-payer`.
3. **Fund** — UI shows address + clear “send testnet USDC here” copy (and optional balance check).
4. **Register with World** — existing AgentBook prepare/complete flow, but signal/register target = **user’s** address.
5. **Tope** — reuse per-address limits store; edit only when that agent is human-backed.
6. **Purchase / HITL** — `getPaidFetch` / x402 client must pay from the **user’s** CDP account name/address.

### What must change in code (sketch)

| Area | Today | Change |
| --- | --- | --- |
| `lib/agent-payer.ts` | Hardcoded `accountName: "stay-agent-payer"` | Resolve account from user session / agent id |
| `/api/agent/status` | Shared wallet status | Status for **current user’s** agent |
| `/api/agent/register/*` | Registers shared address | Registers **current** agent address |
| `/api/agent/limits` | Keyed by address (OK) | Load/save for **current** agent only |
| `/api/agent/purchase` + `approve/*` | Pays as shared agent | Pays / approves as **current** agent |
| UI Configurar | One badge / one wallet | “Crear agente” → fund → register → tope |
| Persistence | `/tmp` files | Need durable store for user→agent mapping (KV/DB); `/tmp` is not enough |

### Suggested APIs (new / extended)

```
POST /api/agent/create
  → { agentId, address, accountName }
  → binds agent to this browser/user session

GET  /api/agent/me
  → { agentId, address, funded?, registered?, limits, balances? }

GET  /api/agent/status   (scoped to current agent — same shape as today)
POST /api/agent/limits   (unchanged shape, scoped)
POST /api/agent/register/prepare|complete  (scoped)
POST /api/agent/approve/* + purchase       (scoped)
```

Exact session mechanism is an open question below.

### Funding (testnet)

- Show agent address prominently after create.
- User sends Base Sepolia USDC (and gas) from a faucet / their wallet.
- Optional: `GET /api/agent/me` includes USDC balance so “Reservar” can warn if underfunded.

---

## Phase B — 0G Storage (receipts)

Runs **after** a successful purchase (can ship right after or in the same epic as multi-user).

### Receipt payload (draft)

```json
{
  "type": "stay-agent.reservation",
  "version": 1,
  "reservedAt": "ISO-8601",
  "agentAddress": "0x…",
  "listing": { "id", "title", "location", "amountUsdc" },
  "payment": { "txHash", "network": "base-sepolia", "usedHumanApproval": false },
  "world": { "humanId": "optional", "hitlAction": "optional" }
}
```

### Flow

```
purchase succeeds
  → build receipt JSON
  → upload to 0G Storage (Galileo testnet)
  → persist { listingId, agentAddress, contentHash, rootHash? }
  → return hash in purchase response
  → UI shows hash / explorer link on “Reserva confirmada”
```

### Code touchpoints (sketch)

| Piece | Role |
| --- | --- |
| `lib/og-storage.ts` (new) | Upload JSON, return content hash |
| `app/api/agent/purchase` | After x402 success, call upload (best-effort or required) |
| Confirmation UI | Show 0G hash |
| Env | 0G RPC / indexer / private key or relay for uploads |

Agentic ID (ERC-7857) is **out of scope** for the first 0G slice — Storage receipts only. See [03-0g.md](./03-0g.md).

---

## What we are explicitly *not* doing in this design

- Agent execution / inference “inside” 0G Compute  
- Marketplace / seller AgentBook verification  
- Mainnet / real USDC  
- Scraping real hotel APIs  
- Keeping the shared demo wallet as the default product path once multi-user ships  

---

## Open questions (decide before coding)

1. **How do we know who the user is?**  
   - A) Anonymous browser session cookie → agent mapping (fastest demo)  
   - B) World ID login first, then create agent under that human  
   - C) Simple email/wallet login  
   Recommendation for first slice: **A**, with a clear “this device’s agent” label; migrate to B later.

2. **Who creates the CDP account?**  
   Server uses CDP API keys to `getOrCreateAccount({ name })` per user. User never sees the CDP secret — they only fund the address.

3. **Persistence**  
   Multi-user **requires** durable storage (user/session → accountName/address). Replace `/tmp` for agents, limits, and HITL tokens (KV/Redis/Postgres).

4. **0G upload failure**  
   - Soft-fail: reservation still OK, UI says “recibo 0G pendiente”  
   - Hard-fail: purchase response errors if upload fails  
   Recommendation: **soft-fail** for testnet UX.

5. **Shared demo wallet**  
   Keep behind `DEMO_SHARED_AGENT=true` for emergency demos, default off once multi-user is live.

---

## Implementation order (when we build)

1. Durable store + session → agent mapping  
2. `POST /api/agent/create` + UI “Crear mi agente” + fund copy  
3. Scope status / register / limits / purchase / HITL to current agent  
4. Remove shared payer as default  
5. 0G upload after purchase + hash in confirmation UI  
6. Update checklist + retire “shared wallet” section of [11-demo-tradeoffs.md](./11-demo-tradeoffs.md)

---

## Relation to current phases

| Phase | Role here |
| --- | --- |
| 2C HITL | Still required for over-tope spends — per **user** agent |
| Multi-user | Unlocks “my wallet / my agent / my tope” |
| 3 — 0G | Receipt after **that** agent’s successful pay |

Docs index: [README.md](./README.md) · checklist: [06-checklist.md](./06-checklist.md).
