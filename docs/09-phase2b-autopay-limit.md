# Phase 2B — Owner auto-pay limit

## Rule

After AgentBook (2A), the **owner of the agent** sets a max USDC amount the agent may spend **automatically**.

| Amount vs limit | Behavior |
| --- | --- |
| `price <= autoPayLimitUsdc` | Pay via x402 (Phase 1 flow) |
| `price > autoPayLimitUsdc` | `403 NEEDS_HUMAN_APPROVAL` (Step C later) |

Constraints:

- **Minimum configurable limit:** `$0.01` USDC  
- **Default** if owner never saved: hardcoded **`$0.1`** (optional env `DEFAULT_AUTO_PAY_LIMIT_USDC` later)  
- Only editable when the agent is human-backed (or gate is off)  
- Still **payer-only** — marketplace not involved  

## UI

In the agent panel:

1. Register agent (2A) → Human-backed ✓  
2. (Optional) Set “Tope de pago automático” (≥ 0.01) → Guardar  
3. Bookings at/under the tope pay; above are blocked until HITL  

Demo listings:

- Cheap stays at **$0.05** → auto-pay under default `$0.1`  
- **Casa frente al lago** at **$0.2** → over default tope (demo block)  
- **Mendoza · $2** → over default; raise tope or wait for Step C

## APIs

### `GET /api/agent/limits`
Returns current limit, min/max, whether UI can edit.

### `POST /api/agent/limits`
Body: `{ "autoPayLimitUsdc": 5 }`  
Requires AgentBook registration when the gate is on.

## Storage

- Local: `data/agent-limits.json`  
- Vercel: `/tmp/stay-agent-limits.json` (ephemeral across instances — OK for demo; use KV/DB later)

## Env (optional)

Hardcoded default is already `0.1`. Later you can override:

```bash
DEFAULT_AUTO_PAY_LIMIT_USDC=0.1
```
