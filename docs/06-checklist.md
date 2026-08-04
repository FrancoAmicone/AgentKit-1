# Checklist — StayAgent

## Fase 1 — MVP (testnet x402)

### Cuentas

- [x] Cuenta en [CDP Portal](https://portal.cdp.coinbase.com)
- [x] Crear API key → `CDP_API_KEY_ID` + `CDP_API_KEY_SECRET`
- [x] Crear / copiar `CDP_WALLET_SECRET`
- [ ] (Opcional) `OPENAI_API_KEY` o `ANTHROPIC_API_KEY` para mejor NLP

### Proyecto

- [x] `.env.local` / env vars con las 3 keys CDP
- [x] `npm install` (o deploy Vercel)
- [x] `npm run setup:wallets`
- [x] `AGENT_WALLET_ADDRESS` + `MARKETPLACE_WALLET_ADDRESS` configuradas
- [x] `CDP_X402_CLIENT_ENVIRONMENT=development`
- [x] App corriendo (local y/o Vercel)

### Probar el flujo

- [x] Buscar lodging en lenguaje natural
- [x] Ver tarjetas / resultados
- [x] **Reservar y pagar** con éxito (Bariloche · $0.2 USDC)
- [x] Ver confirmación + link Basescan Sepolia
- [ ] (Opcional) Reintentar el mismo listing → debe fallar (ya reservado)
- [ ] (Opcional) Verificar que el USDC llegó a `MARKETPLACE_WALLET_ADDRESS`

### Debug (ya no bloquea)

- [x] Faucet / saldo agente resuelto (bajamos precios a $0.2)
- [x] Pago x402 end-to-end en Base Sepolia

**Fase 1: DONE**

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

## Fase 3 — 0G Storage (auditoría / recibos)

- [ ] Agregar Galileo testnet (chainId `16602`)
- [ ] Faucet https://faucet.0g.ai
- [ ] Tras cada compra exitosa, subir JSON recibo a 0G Storage
- [ ] Mostrar content hash en la UI de confirmación

Ver [03-0g.md](./03-0g.md).

---

## Fase 4 — Discovery (stretch)

- [ ] Probar Bazaar / agentic.market para fuentes externas
- [ ] No depende de APIs de hoteles reales

---

## Antes de mainnet (más adelante)

- [ ] Límites de gasto del agente
- [ ] Confirmación explícita en UI para montos altos
- [ ] Persistencia real de reservas (DB; hoy es in-memory)
- [ ] Mainnet Base + USDC real (solo cuando policy esté lista)
- [ ] No commitear secrets; rotar keys si se filtraron
