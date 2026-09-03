# Host World / AgentBook verification

**Status: implemented.** Symmetric to the guest agent: the host’s **payout
wallet** must be registered in World AgentBook before they can publish stays
(and before `/buy` settles to a host/listing `payTo`).

## Flow

1. `/host` → register payout `0x…` (`POST /api/host/profile`)
2. **Verificar con World App** → `GET /api/host/register/prepare` → World Bridge
   proof → `POST /api/host/register/complete` (same AgentBook relay as buyer)
3. Publish → `POST /api/host/listings` asserts AgentBook on the effective payTo
   (listing override or host profile). Marketplace-only publish is blocked when
   the gate is on.
4. Guest pays → `/api/listings/[id]/buy` re-checks host/listing payTo when
   `REQUIRE_HUMAN_BACKED_HOST` is true.

## Env

```bash
REQUIRE_HUMAN_BACKED_HOST=true   # default if unset
# REQUIRE_HUMAN_BACKED_HOST=false  # temporary bypass
```

## Key files

| Path | Role |
|------|------|
| `lib/agentbook.ts` | `getHostBookStatus`, `assertHostPayoutIsHumanBacked`, `isHumanBackedHostRequired` |
| `app/api/host/register/prepare|complete` | AgentBook registration for host payout |
| `app/api/host/listings` | `world` / `canPublish` on GET; gate on POST |
| `app/api/host/profile` | Returns `world` status with profile |
| `app/host/page.tsx` | Wallet panel + World verify UI; publish disabled until verified |
| `components/AgentRegisterPanel.tsx` | Reused with host prepare/complete URLs |

## Out of scope (still)

- SIWE / personal-sign ownership of the pasted wallet
- Marketplace platform wallet AgentBook gating
- Persistencia real (KV/DB)

Relación: [15](./15-host-payouts-and-availability.md) · [08](./08-phase2-agentbook.md) · checklist [06](./06-checklist.md)
