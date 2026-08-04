# Phase 2A — AgentBook gate (payer only)

## Rule

- **Search:** free, no World check  
- **Purchase:** only if the **agent (payer)** wallet is registered in World AgentBook  
- **Marketplace (receiver):** **no** World verification  

```
User searches          → OK (no AgentKit)
User clicks "pay"      → check AgentBook(agentAddress)
                         ├─ not registered → 403 + register hint
                         └─ registered     → x402 pay as in Phase 1
USDC lands on marketplace wallet → no human check on that address
```

## Why only the agent?

World AgentKit answers: “is the automation that spends money backed by a unique human?”  
The seller/marketplace address is just where funds settle — it doesn’t need to be an “agent”.

## What you must do (one-time)

1. Install World App and complete World ID.  
2. Register the **agent** address (same as `AGENT_WALLET_ADDRESS` / CDP `stay-agent-payer`):

```bash
npx @worldcoin/agentkit-cli register 0xYourAgentAddress
```

3. Confirm:

```bash
npx @worldcoin/agentkit-cli status 0xYourAgentAddress
```

4. In the app UI → “Ya lo registré — refrescar status” → badge **Human-backed ✓**  
5. Then **Reservar y pagar** works again.

## Code touchpoints

| File | Role |
| --- | --- |
| `lib/agentbook.ts` | `lookupHuman` via `createAgentBookVerifier` |
| `app/api/agent/status/route.ts` | GET status for UI |
| `app/api/agent/purchase/route.ts` | Gate before x402 pay |
| `app/page.tsx` | Badge + disable buy if not registered |

## Env

```bash
REQUIRE_HUMAN_BACKED_AGENT=true   # default behavior if unset
# REQUIRE_HUMAN_BACKED_AGENT=false  # temporary bypass for local debugging
```

Set the same on Vercel after deploy.

## Not in this slice

- HITL (approve each large payment) — Step C later  
- Verifying marketplace / sellers  
- 0G receipts  
