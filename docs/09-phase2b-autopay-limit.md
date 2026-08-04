# Phase 2B — Owner auto-pay limit

## Rule

After AgentBook (2A), the **owner of the agent** sets a max USDC amount the agent may spend **automatically**.

| Amount vs limit | Behavior |
| --- | --- |
| `price <= autoPayLimitUsdc` | Pay via x402 (Phase 1 flow) |
| `price > autoPayLimitUsdc` | `403 NEEDS_HUMAN_APPROVAL` (Step C later) |

Constraints:

- **Minimum configurable limit:** `$1` USDC  
- **Default** if owner never saved: `DEFAULT_AUTO_PAY_LIMIT_USDC` or `$1`  
- Only editable when the agent is human-backed (or gate is off)  
- Still **payer-only** — marketplace not involved  

## UI

In the agent panel:

1. Register agent (2A) → Human-backed ✓  
2. Set “Tope de pago automático” (≥ 1) → Guardar  
3. Bookings at/under the tope pay; above are blocked until HITL  

Demo listing: **Mendoza · $2** (over the $1 floor) to test the block.  
Cheap listings stay at **$0.2** and auto-pay when limit is ≥ 1.

## APIs

### `GET /api/agent/limits`
Returns current limit, min/max, whether UI can edit.

### `POST /api/agent/limits`
Body: `{ "autoPayLimitUsdc": 5 }`  
Requires AgentBook registration when the gate is on.

## Storage

- Local: `data/agent-limits.json`  
- Vercel: `/tmp/stay-agent-limits.json` (ephemeral across instances — OK for demo; use KV/DB later)

## Env

```bash
DEFAULT_AUTO_PAY_LIMIT_USDC=1
```
