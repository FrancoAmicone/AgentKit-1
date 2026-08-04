# Checklist — StayAgent

## Fase 1 (ahora)

### Cuentas

- [ ] Cuenta en [CDP Portal](https://portal.cdp.coinbase.com)
- [ ] Crear API key → `CDP_API_KEY_ID` + `CDP_API_KEY_SECRET`
- [ ] Crear / copiar `CDP_WALLET_SECRET`
- [ ] (Opcional) `OPENAI_API_KEY` o `ANTHROPIC_API_KEY` para mejor NLP

### Proyecto

- [ ] `cp .env.example .env.local` y pegar las 3 keys CDP
- [ ] `npm install`
- [ ] `npm run setup:wallets`
- [ ] Pegar en `.env.local`:
  - `AGENT_WALLET_ADDRESS=...`
  - `MARKETPLACE_WALLET_ADDRESS=...`
- [ ] Confirmar `CDP_X402_CLIENT_ENVIRONMENT=development`
- [ ] `npm run dev` → http://localhost:3000

### Probar el flujo

- [ ] Buscar: *“Casa en Bariloche con pileta, menos de 150”*
- [ ] Ver tarjetas con match reason
- [ ] **Reservar y pagar** en una
- [ ] Ver confirmación (y link Basescan si hay tx hash)
- [ ] Reintentar el mismo listing → debe fallar (ya reservado)

### Si el pago falla

- [ ] ¿Keys CDP correctas en `.env.local`?
- [ ] ¿Corriste `setup:wallets` y pegaste `MARKETPLACE_WALLET_ADDRESS`?
- [ ] ¿La wallet del agente tiene USDC (y ETH para gas) en Base Sepolia?
- [ ] Revisá logs del server en la terminal de `npm run dev`
- [ ] Faucet manual: [CDP Portal](https://portal.cdp.coinbase.com) / faucet Base Sepolia

---

## Fase 2A — AgentBook gate (solo agente que compra)

Ver [08-phase2-agentbook.md](./08-phase2-agentbook.md).

- [x] Código: gate en `/api/agent/purchase` + `/api/agent/status` + UI badge
- [x] Marketplace/receiver **sin** verificación (by design)
- [ ] World App en el teléfono
- [ ] `npx @worldcoin/agentkit-cli register <AGENT_WALLET_ADDRESS>`
- [ ] UI badge → Human-backed ✓
- [ ] `REQUIRE_HUMAN_BACKED_AGENT=true` en Vercel + redeploy
- [ ] Probar: sin registro → 403; con registro → paga

## Fase 2B/C — después

- [ ] Threshold de monto
- [ ] Human-in-the-loop para montos altos

Ver [02-world-agentkit.md](./02-world-agentkit.md).

---

## Fase 3 — 0G (cuando Fase 2 o en paralelo post-pago)

- [ ] Agregar Galileo testnet (chainId `16602`)
- [ ] Faucet https://faucet.0g.ai
- [ ] Integrar upload de recibo JSON post-compra
- [ ] Mostrar hash en la UI de confirmación

Ver [03-0g.md](./03-0g.md).

---

## Antes de mainnet (más adelante)

- [ ] Límites de gasto del agente
- [ ] Confirmación explícita en UI para montos altos
- [ ] Logs / recibos persistentes (0G o DB)
- [ ] No commitear secrets; rotar keys si se filtraron
