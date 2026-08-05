# Phase 2B — Owner auto-pay limit

**Estado: código DONE.** Validar en prod el bloqueo de listings **$0.2** con tope **$0.1** si aún no se probó.

## Rule

After AgentBook (2A), the **owner of the agent** sets a max USDC amount the agent may spend **automatically**.

| Amount vs limit | Behavior |
| --- | --- |
| `price <= autoPayLimitUsdc` | Pay via x402 (Phase 1 flow) |
| `price > autoPayLimitUsdc` | `403 NEEDS_HUMAN_APPROVAL` (Phase 2C later) |

Constraints:

- **Minimum configurable limit:** `$0.01` USDC  
- **Default** if owner never saved: hardcoded **`$0.1`** (optional env `DEFAULT_AUTO_PAY_LIMIT_USDC`)  
- Only editable when the agent is human-backed (or gate is off)  
- Still **payer-only** — marketplace not involved  

## UI

Popup **Configurar** (chip arriba a la derecha):

1. Register agent (2A) if needed → Human-backed ✓  
2. Set “Tope de pago automático” (≥ 0.01) → Guardar  
3. Bookings at/under the tope pay; above are blocked until HITL (2C)  

## Demo listings (`lib/listings-data.ts`)

| Precio | Uso |
| --- | --- |
| **$0.05** | Bajo tope default — auto-pay (Bariloche cabaña, Ushuaia, Palermo) |
| **$0.20** | Sobre tope default — bloqueo `NEEDS_HUMAN_APPROVAL` (lago, Mendoza, Salta, Pinamar, Córdoba, Iguazú, Calafate, MdP, Rosario) |

## APIs

### `GET /api/agent/limits`
Returns current limit, min/max, whether UI can edit.

### `POST /api/agent/limits`
Body: `{ "autoPayLimitUsdc": 0.1 }`  
Requires AgentBook registration when the gate is on.

## Storage

- Local: `data/agent-limits.json`  
- Vercel: `/tmp/stay-agent-limits.json` (ephemeral across instances — OK for demo; use KV/DB later)

## Env (optional)

```bash
DEFAULT_AUTO_PAY_LIMIT_USDC=0.1
```
