# Phase 2C — Human-in-the-loop (over-limit spend)

**Estado: implementado (lean StayAgent flow).**

When a booking price exceeds the owner auto-pay tope (2B), the user must approve that **specific spend** in World App before the agent pays.

## Flow

```
User taps $0.2 listing (tope $0.1)
  → UI opens “Aprobación humana”
  → POST /api/agent/approve/prepare
  → World App QR / deep link (action bound to listing + nonce)
  → POST /api/agent/approve/complete → one-time approvalToken
  → POST /api/agent/purchase { listingId, approvalToken }
  → x402 pay as Phase 1
```

Under-limit purchases skip HITL entirely.

## Why not the official Workflow HITL package?

`@worldcoin/human-in-the-loop` expects Vercel AI SDK + Workflow SDK + `WORLD_RP_ID` / signing keys.  
StayAgent uses a simple purchase API, so we reuse the same World Bridge pattern as AgentBook register (`@worldcoin/idkit-core`).

## Security model (demo)

- Approval session is server-issued and expires (~15 min).  
- World Bridge only returns a proof after a live World App verification for that action/signal.  
- `approvalToken` is one-time and bound to agent + listing + amount.  
- Marketplace still not verified.

## Code

| File | Role |
| --- | --- |
| `lib/human-approval.ts` | Sessions + one-time tokens |
| `app/api/agent/approve/prepare/route.ts` | Start HITL |
| `app/api/agent/approve/complete/route.ts` | Mint token after World ID |
| `app/api/agent/purchase/route.ts` | Accept `approvalToken` when over tope |
| `components/PurchaseApprovalModal.tsx` | QR / deep link UI |

## Env (optional)

```bash
# Defaults to the same app id used by AgentBook register
# WORLD_ID_APP_ID=app_a7c3e2b6b83927251a0db5345bd7146a
```
