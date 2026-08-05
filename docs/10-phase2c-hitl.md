# Phase 2C — Human-in-the-loop (over-limit spend)

**Estado: implementado (lean StayAgent flow).**

When a booking price exceeds the owner auto-pay tope (2B), the user must approve that **specific spend** in World App before the agent pays.

## Flow

```
User taps $0.2 listing (tope $0.1)
  → Popup: “¿Aprobás este gasto?” → Sí / No
  → Si Sí: POST /api/agent/approve/prepare
  → World App QR / deep link
  → POST /api/agent/approve/complete → one-time approvalToken
  → POST /api/agent/purchase { listingId, approvalToken }
  → x402 pay
  → Si No: se cierra el popup (no paga)
```

Under-limit purchases skip HITL entirely.

## Mobile / World App (best practices)

1. **Prepare first** (async) — create World Bridge session + QR.  
2. **Do not auto-open** after await (browsers lose the user gesture → popup spam / Chrome blocks).  
3. **One open:** a single `<a href={connectorURI} target="_blank">Abrir World App</a>` after prepare.  
4. Never use `location.href` (kills poll) or double `window.open` fallbacks.  
5. Modal is portaled to `document.body` with opaque scrim so listing images don’t bleed through.  
6. Always show **QR** as fallback if the store opens instead of the app.

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
| `lib/world-bridge.ts` | Shared World Bridge create + poll (`AbortSignal`) |
| `components/ui/Modal.tsx` | Portal modal (body, opaque scrim) |
| `components/WorldAppVerifyPanel.tsx` | Single `<a>` + QR (no auto-open) |
| `app/api/agent/approve/prepare/route.ts` | Start HITL |
| `app/api/agent/approve/complete/route.ts` | Mint token after World ID |
| `app/api/agent/purchase/route.ts` | Accept `approvalToken` when over tope |
| `components/PurchaseApprovalModal.tsx` | Sí/No + World verify + purchase |

Demo shortcuts: [11-demo-tradeoffs.md](./11-demo-tradeoffs.md).

## Env (optional)

```bash
# Defaults to the same app id used by AgentBook register
# WORLD_ID_APP_ID=app_a7c3e2b6b83927251a0db5345bd7146a
```
