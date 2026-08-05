# Demo tradeoffs — atajos conscientes

Shortcuts kept on purpose for the testnet demo. Not production patterns.
If something below looks “wrong,” discuss before changing — it may be intentional.

## Shared payer wallet

One CDP account account (`stay-agent-payer`) pays for everyone. Fine for hackathon demos; not multi-tenant. Real product: each user funds / registers their own agent wallet.

## File / `/tmp` persistence

`lib/agent-limits.ts` and `lib/human-approval.ts` store state under `/tmp` (or local `.data/`). On Vercel serverless this can reset between instances. Enough to demo HITL + tope; not durable. Next step: Redis / KV / DB.

## Lean HITL (not official Human-in-the-Loop SDK)

We use World Bridge (`@worldcoin/idkit-core` store) + our own `approvalToken`, not `@worldcoin/human-in-the-loop` (needs Workflow / AI SDK + portal keys). Proof completion is accepted when Bridge returns a result; we do **not** re-verify the proof with World’s cloud API before minting the one-time token. Acceptable for Sepolia demo; tighten before mainnet.

## Pricing catalog

Listings at **$0.05** (under default tope → auto-pay) and **$0.2** (over → HITL) exist so both paths are easy to click through. Not real lodging prices.

## Marketplace not AgentBook-gated

Only the paying agent must be human-backed. Receiver/marketplace wallet is unverified by design for Phase 2A scope.

## Client World open

Never `location.href` (kills poll). Never auto-`window.open` after `await` (popup spam). User must tap a real `<a target="_blank">` or scan QR — see `lib/world-bridge.ts` + `WorldAppVerifyPanel`.
