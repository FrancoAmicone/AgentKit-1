# Phase 2B — Owner auto-pay limit

**Estado: DONE.**

## Rule

After AgentBook (2A), the **owner of the agent** sets a max USDC amount the agent may spend **automatically**.

| Amount vs limit | Behavior |
| --- | --- |
| `price <= autoPayLimitUsdc` | Pay via x402 |
| `price > autoPayLimitUsdc` | Phase 2C World approval → then pay |

- **Min:** `$0.01` · **Default:** `$0.1`  
- Editable in **Configurar** when human-backed  

## Demo listings

- **$0.05** — auto-pay under default tope  
- **$0.20** — requires HITL (see [10-phase2c-hitl.md](./10-phase2c-hitl.md))

## APIs

- `GET/POST /api/agent/limits`  
- Storage: `data/agent-limits.json` or `/tmp` on Vercel  
