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

## Marketplace not AgentBook-gated

Only the paying agent must be human-backed. Receiver/marketplace wallet is unverified by design for Phase 2A scope.

## Client World open

Never `location.href` on the StayAgent tab (kills poll). On **desktop**, don’t
auto-`window.open` after `await` (popup spam) — user taps `<a>` or scans QR.
On **mobile**, reserve a window in the tap handler and navigate it to the
verify URI (no QR); if the app isn’t installed, surface App Store / Play Store
links. See `lib/world-app-link.ts` + `WorldAppVerifyPanel`.
