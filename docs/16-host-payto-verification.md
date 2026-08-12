# Host payTo verification + stay page 404 fix

**Status: implemented.**

## Bug: 404 after publishing a property

On Vercel, host listings / profiles / bookings used to live under `/tmp`.
Serverless instances do **not** share `/tmp`:

1. `POST /api/host/listings` wrote the property on instance A  
2. Browser opened `/stays/<id>` on instance B  
3. `getListing` returned `undefined` → `notFound()` → **404**

That made it look like `/stays/[id]` “didn’t exist”, and also broke the
guest→host payment path (buy couldn’t resolve the listing / payTo).

### Fix

| Piece | Change |
| --- | --- |
| `lib/demo-store.ts` | Shared JSON store: **file** locally, **Vercel Runtime Cache** (`@vercel/functions` `getCache`) on Vercel — shared across instances in the region |
| `lib/host-listings.ts`, `lib/host-profile.ts`, `lib/bookings.ts` | Use `demo-store` instead of `/tmp` |
| `app/stays/[id]/page.tsx` | No hard `notFound()`; passes `listing: null` to the client |
| `components/StayDetail.tsx` | Soft-loads via `GET /api/listings/[id]`, with retry UI if still missing |
| `/host` publish | `router.push` to the public URL right after publish |

Runtime Cache is still ephemeral (TTL 14d, LRU) — fine for the demo, not a
real DB. Long-term: Upstash / Neon (see [06](./06-checklist.md)).

## Corroborating automatic payment to the host

The x402 `/buy` endpoint charges the guest agent and settles USDC to the
listing’s resolved `payTo`. Resolution is centralized in
`resolveListingPayTo` (`lib/listings.ts`) and used by **both** the public
listing API and the buy route (they cannot disagree):

```
1. listing.payoutAddress     → source: "listing"
2. host profile wallet       → source: "host"
3. MARKETPLACE_WALLET_ADDRESS → source: "marketplace"  (default)
```

### How to verify (manual)

1. `/host` → register **Tu wallet de cobro** (`0x…` you control on Base Sepolia).  
2. Publish a property (optional: availability window). You should land on
   `/stays/<id>` — **not** a 404.  
3. On the public page, the box **“Cobro automático (x402 → wallet del
   anfitrión)”** must show **your** address.  
4. `GET /api/listings/<id>` returns:
   ```json
   { "payout": { "address": "0x…", "source": "host", "isEvm": true } }
   ```
5. Guest configures agent (create · fund · World · tope), picks free dates,
   reserves under the tope → auto-pay.  
6. Confirm:
   - reservation JSON includes `payTo` = host wallet and `payoutSource: "host"`
   - Basescan tx sends USDC to that address
   - host dashboard shows the booking + tx link
   - calendar locks those nights for everyone

If the host never registered a wallet, `source` stays `"marketplace"` and
the single marketplace wallet receives the money (intentional default).

### What this proves

| Claim | Evidence |
| --- | --- |
| Guest agent can auto-pay | purchase under tope → x402 settle without HITL |
| Money goes to the host | `payTo` = host profile wallet; Basescan receiver matches |
| Nights lock publicly | calendar + bookings store after settle |
| Host sees it | `/host` “Reservas recibidas” with tx |

Without CDP keys in an environment you can still corroborate steps 1–4
(publish → page loads → payout points at host). Steps 5–6 need funded
agent + CDP on Base Sepolia.

Relación: [14](./14-two-sided-ui.md) · [15](./15-host-payouts-and-availability.md) ·
tradeoffs [11](./11-demo-tradeoffs.md)
