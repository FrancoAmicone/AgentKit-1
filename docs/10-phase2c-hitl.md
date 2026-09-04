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

1. **Prepare first** (async) — create World Bridge session.  
2. **Desktop:** show QR + “Abrir World App” (no auto-open after await).  
3. **Mobile:** **no QR**. Reserve a window on the tap gesture, navigate it to
   `connectorURI` so World App opens without a second click.  
4. Never use `location.href` on the StayAgent tab (kills poll) or spam
   `window.open` after `await`.  
5. If World isn’t installed: after ~1.8s still visible → highlight **App Store
   (iOS)** or **Play Store (Android)** (`lib/world-app-link.ts`).  
   The Bridge URL `https://world.org/verify` is a Universal Link for **World ID**.
   On the phone we rewrite it to `worldapp://verify…` (iOS) or an Android
   intent targeting `com.worldcoin` so **World App** opens instead. The QR
   stays on the https URL so World App’s camera scanner still works.  
6. Modal is portaled to `document.body` with opaque scrim so listing images
   don’t bleed through.

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
| `components/WorldAppVerifyPanel.tsx` | Desktop: `<a>` + QR. Mobile: auto-open + store fallback (no QR) |
| `lib/world-app-link.ts` | Mobile/OS detect, store URLs, reserved-window open |
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
