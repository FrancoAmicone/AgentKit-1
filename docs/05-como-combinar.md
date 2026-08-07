# Cómo se combinan las piezas en StayAgent

| Fase | Pieza | Estado |
| --- | --- | --- |
| **1** | CDP + x402 | **Hecha** |
| **2A/2B** | AgentBook + tope auto-pay | **Hecha** |
| **2C** | World HITL (approve spend) | **Hecha** |
| **—** | Multi-user (wallet propia) | Implementado → [12](./12-multiuser-and-0g.md) |
| **3** | 0G Storage (recibos) | Implementado → [13](./13-env-and-0g-setup.md) |
| **4** | Discovery | Opcional |

Regla: pago testnet → identidad → tope → HITL → **agente por usuario** → recibos 0G.

Detalle: [07-stay-agent.md](./07-stay-agent.md) · [06-checklist.md](./06-checklist.md).
