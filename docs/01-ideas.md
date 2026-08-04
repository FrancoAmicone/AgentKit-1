# Ideas (histórico)

**Idea elegida e implementada (Fase 1):** [StayAgent](./07-stay-agent.md).

Este archivo solo guarda el tablero previo. HumanSplit y los pivotes de “3ra edad / impacto social amplio” quedaron descartados a favor de un MVP simple: buscar estadía → pagar onchain.

## Criterios suaves

- Resolver una necesidad puntual (no un “agente que hace de todo”).
- Que pueda actuar solo en un momento concreto.
- Usar solo las piezas del stack que sumen (1, 2 o 3 — sin forzar).

---

## Idea 1 — One Human, One Claim

**Problema:** faucets, airdrops, rewards y claims se farmean con bots/wallets infinitas.

**Qué hace el agente:** verifica que hay un humano único detrás → si ese humano no claimó → ejecuta el payout/mint onchain → marca como claimado.

**Necesidad puntual:** “quiero repartir X sin que me sybileen”.

**Stack probable:** World (esencial) + cadena de payout (Coinbase/Base u otra). 0G opcional (log del claim).

---

## Idea 2 — Bounty inbox anti-spam

**Problema:** bounties, forms y “issues por plata” se llenan de bots.

**Qué hace el agente:** toma una bounty publicada → entrega prueba de trabajo → cobra escrow USDC si cumple reglas.

**Necesidad puntual:** “pago por un laburo chico, sin spam”.

**Stack probable:** World (quién puede tomar) + Base/CDP (escrow/payout) + 0G (guardar delivery/recibo).

---

## Idea 3 — Data buyer (x402) con trial humano

**Problema:** APIs agenticas se spamean; o al revés, querés dar trial solo a agentes con humano detrás.

**Qué hace el agente:** llama APIs con `agentkit.fetch` → free-trial si human-backed → si no, paga x402 → usa el dato para una acción chica onchain (opcional).

**Necesidad puntual:** “consumir/vender datos a agentes sin morir de bots”.

**Stack probable:** World + x402. Coinbase/Base si hay settlement USDC. 0G si cacheás resultados.

---

## Idea 4 — Rifa / allowlist anti-bot

**Problema:** bots llenan raffles, allowlists y mints.

**Qué hace el agente:** registra entrada solo si es human-backed → al cierre sortea → paga/mintea al ganador.

**Necesidad puntual:** “sorteo justo, un humano = una entrada”.

**Stack probable:** World + txs onchain. 0G opcional.

---

## Idea 5 — Gastos con freno humano (HITL)

**Problema:** dar una wallet a un LLM da miedo.

**Qué hace el agente:** ejecuta pagos chicos solo; si supera umbral, pausa y pide aprobación World ID.

**Necesidad puntual:** “automatizar lo rutinario, frenar lo sensible”.

**Stack probable:** World HITL + Coinbase AgentKit. 0G opcional (audit).

---

## Idea 6 — Attestation / “yo estuve ahí”

**Problema:** asistencia, entregas o hitos se falsifican fácil.

**Qué hace el agente:** escribe onchain (o en storage) “humano H atestiguó X” y opcionalmente desbloquea un pago.

**Necesidad puntual:** “prueba de que un humano real confirmó algo”.

**Stack probable:** World + 0G Storage (evidencia) y/o Base (payout/badge).

---

## Vista rápida

| # | Idea | ¿World es clave? | Complejidad MVP |
| --- | --- | --- | --- |
| 1 | One Claim | Sí | Baja |
| 2 | Bounty inbox | Sí | Media |
| 3 | Data buyer x402 | Sí | Media |
| 4 | Rifa / allowlist | Sí | Baja–media |
| 5 | Gastos + HITL | Parcial | Media |
| 6 | Attestation | Sí | Media |

## Estado

- [ ] Elegir 1 idea (o fusionar dos)
- [ ] Definir qué piezas usamos (ver `05-como-combinar.md`)
- [ ] Recién ahí scaffold de código

## Notas de la conversación

- No forzar World + 0G + Coinbase juntos.
- Primero alinear problema; después stack.
- Prefieren ideas tipo 1–6 por encima de “split de pagos”.
