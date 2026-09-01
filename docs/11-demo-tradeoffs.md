# Demo tradeoffs — atajos conscientes

Shortcuts kept on purpose for the testnet demo. Not production patterns.
If something below looks “wrong,” discuss before changing — it may be intentional.

## Shared payer wallet

One CDP account (`stay-agent-payer`) pays for everyone. Fine for hackathon demos; not multi-tenant.

**Target (design):** each user creates and funds **their own** agent wallet — see [12-multiuser-and-0g.md](./12-multiuser-and-0g.md).

## File / `/tmp` persistence

`lib/agent-limits.ts` and `lib/human-approval.ts` still store state under
`/tmp` (or local `data/`) on Vercel — can reset between instances.

**Host listings / profiles / bookings** no longer use `/tmp`: they go through
`lib/demo-store.ts` (Vercel Runtime Cache when `VERCEL=1`, file locally). That
fixes the post-publish `/stays/[id]` 404. Still ephemeral demo storage — see
[16-host-payto-verification.md](./16-host-payto-verification.md). Next step for
everything: Redis / KV / DB.

## Lean HITL (not official Human-in-the-Loop SDK)

We use World Bridge (`@worldcoin/idkit-core` store) + our own `approvalToken`, not `@worldcoin/human-in-the-loop` (needs Workflow / AI SDK + portal keys). Proof completion is accepted when Bridge returns a result; we do **not** re-verify the proof with World’s cloud API before minting the one-time token. Acceptable for Sepolia demo; tighten before mainnet.

## Pricing catalog

Listings at **$0.05** (under default tope → auto-pay) and **$0.2** (over → HITL) exist so both paths are easy to click through. Not real lodging prices.

## Marketplace wallet (platform fallback)

The shared `MARKETPLACE_WALLET_ADDRESS` remains an unverified platform
fallback. **Host and listing payTo wallets** must be AgentBook / World-backed
when `REQUIRE_HUMAN_BACKED_HOST` is on (default). Buyer agent wallets stay
gated by `REQUIRE_HUMAN_BACKED_AGENT`.

## Client World open

Never `location.href` (kills poll). Never auto-`window.open` after `await` (popup spam). User must tap a real `<a target="_blank">` or scan QR — see `lib/world-bridge.ts` + `WorldAppVerifyPanel`.
