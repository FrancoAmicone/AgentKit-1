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

1. Install World App and complete World ID (Orb).  
2. In StayAgent UI → **Registrar con World App**  
   - **Mobile:** opens World App via deep link  
   - **Desktop:** shows a QR to scan with World App  
3. After verification, the app submits AgentBook registration (hosted relay) and the badge flips to **Human-backed ✓**.  
4. Then **Reservar y pagar** works again.

### CLI fallback (optional)

```bash
npx @worldcoin/agentkit-cli register 0xYourAgentAddress
npx @worldcoin/agentkit-cli status 0xYourAgentAddress
```

### One shared agent wallet (current demo)

Today every visitor uses the same CDP payer wallet (`stay-agent-payer`).  
Registration links **that** address to **your** World ID.

Creating a *different* agent per person is possible later (new wallet → fund → register that address → pay with it), but StayAgent does not create per-user wallets yet.

## Code touchpoints

| File | Role |
| --- | --- |
| `lib/agentbook.ts` | `lookupHuman` via `createAgentBookVerifier` |
| `lib/agentbook-register.ts` | nonce + proof normalize + relay submit |
| `app/api/agent/register/prepare/route.ts` | nonce + World ID app/action for UI |
| `app/api/agent/register/complete/route.ts` | POST proof → AgentBook relay |
| `components/AgentRegisterPanel.tsx` | Button + QR / deep link + poll |
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
