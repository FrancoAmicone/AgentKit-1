# Design — Multi-user agents + Phase 3 (0G Storage)

**Status: design only — not implemented.**  
**Prerequisite:** finish Phase 2C prod HITL validation when convenient; this design can be refined in parallel.

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

```
1. User opens StayAgent
2. No agent yet → “Crear mi agente”
      → server creates a dedicated CDP EOA for this user
      → returns address (+ funding instructions)
3. User funds that wallet (testnet USDC on Base Sepolia; ETH for gas if needed)
4. User registers the agent with World → AgentBook (human-backed)
5. User configures auto-pay tope for *this* agent
6. Search lodgings → “Reservar”
      ├─ price ≤ tope  → that agent pays via x402
      └─ price > tope  → World HITL for this spend → then that agent pays
7. On success → upload receipt JSON to 0G Storage
8. Confirmation UI shows: listing, tx/explorer link, 0G content hash (+ link if available)
```

Identity for “who is this browser user?” is a separate product choice (see Open questions). The **onchain payer** is always the user’s agent wallet, never the shared demo one.

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
