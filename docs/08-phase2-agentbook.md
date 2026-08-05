# Phase 2A — AgentBook gate (payer only)

**Estado: DONE** (demo con wallet CDP compartida).

## Rule

- **Search:** free, no World check  
- **Purchase:** only if the **agent (payer)** wallet is registered in World AgentBook  
- **Marketplace (receiver):** **no** World verification  

```
User searches          → OK (no AgentKit)
User clicks "pay"      → check AgentBook(agentAddress)
                         ├─ not registered → 403 + open Configurar
                         └─ registered     → continue (then 2B tope / x402)
USDC lands on marketplace wallet → no human check on that address
```

## Why only the agent?

World AgentKit answers: “is the automation that spends money backed by a unique human?”  
The seller/marketplace address is just where funds settle — it doesn’t need to be an “agent”.

## What you must do (one-time per agent wallet)

1. Install World App and complete World ID (Orb).  
2. In StayAgent → **Configurar** → **Registrar con World App**  
   - **Mobile:** opens World App via deep link  
   - **Desktop:** shows a QR to scan with World App  
3. After verification, the app submits AgentBook registration (hosted relay) and the badge flips to **Human-backed ✓**.  
4. If already registered, the register UI stays hidden; badge remains **Human-backed ✓**.

### CLI fallback (optional)

```bash
npx @worldcoin/agentkit-cli register 0xYourAgentAddress
npx @worldcoin/agentkit-cli status 0xYourAgentAddress
```

### Ownership note

- Registration binds `agent wallet → anonymous human id` (World ID nullifier).  
- You normally do **not** re-register the same wallet with the same World ID.  
- **Demo today:** everyone shares CDP `stay-agent-payer` — already registered to the demo owner.  
- **Later (multi-user):** each person creates a new wallet → funds it → registers it as their own agent.

## Code touchpoints

| File | Role |
| --- | --- |
| `lib/agentbook.ts` | `lookupHuman` via `createAgentBookVerifier` |
| `lib/agentbook-register.ts` | nonce + proof normalize + relay submit |
| `app/api/agent/register/prepare/route.ts` | nonce + World ID app/action for UI |
| `app/api/agent/register/complete/route.ts` | POST proof → AgentBook relay |
| `components/AgentRegisterPanel.tsx` | Button + QR / deep link + poll |
| `components/AgentSetupModal.tsx` | Configurar popup (verify + tope) |
| `app/api/agent/status/route.ts` | GET status for UI |
| `app/api/agent/purchase/route.ts` | Gate before x402 pay |
| `app/page.tsx` | Badge chip → opens Configurar |

## Env

```bash
REQUIRE_HUMAN_BACKED_AGENT=true   # default behavior if unset
# REQUIRE_HUMAN_BACKED_AGENT=false  # temporary bypass for local debugging
# AGENTBOOK_RELAY_URL=https://x402-worldchain.vercel.app  # optional override
```

## Not in this slice

- HITL (approve each large payment) — Phase 2C  
- Per-user agent wallets  
- Verifying marketplace / sellers  
- 0G receipts  
