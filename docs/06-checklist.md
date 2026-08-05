# Checklist — StayAgent

## Higiene de docs

Cada vez que se termina una tarea: **actualizar este checklist + docs de la fase** en el mismo cambio.

---

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
- [x] **Reservar y pagar** con éxito (Bariloche · USDC testnet)
- [x] Ver confirmación + link Basescan Sepolia
- [ ] (Opcional) Reintentar el mismo listing → debe fallar (ya reservado)
- [ ] (Opcional) Verificar que el USDC llegó a `MARKETPLACE_WALLET_ADDRESS`

**Fase 1: DONE**

---

## Fase 2A — AgentBook gate (solo agente que compra)

Ver [08-phase2-agentbook.md](./08-phase2-agentbook.md).

- [x] Código: gate + status + registro in-app (QR / deep link)
- [x] Marketplace/receiver **sin** verificación (by design)
- [x] Popup **Configurar**; registro solo si falta
- [x] Demo registrada → badge **Human-backed ✓**
- [x] Pago bajo tope ($0.05)

**Fase 2A: DONE**

---

## Fase 2B — Auto-pay limit

Ver [09-phase2b-autopay-limit.md](./09-phase2b-autopay-limit.md).

- [x] Código: limits API + gate + UI modal
- [x] Min **$0.01**; default **$0.1**
- [x] Catálogo demo **$0.05** / **$0.2**
- [x] Guardar tope y pagar $0.05

**Fase 2B: DONE**

---

## Fase 2C — Human-in-the-loop

Ver [10-phase2c-hitl.md](./10-phase2c-hitl.md).

- [x] Código: `approve/prepare` + `approve/complete` + `approvalToken` en purchase
- [x] UI: modal aprobar gasto alto con World App (QR / deep link)
- [ ] Probar en prod: listing **$0.2** + tope **$0.1** → World App → paga

---

## Fase 3 — 0G Storage

- [ ] Galileo testnet + faucet
- [ ] Subir JSON recibo tras compra
- [ ] Mostrar content hash en UI

Ver [03-0g.md](./03-0g.md).

---

## Fase 4 — Discovery (stretch)

- [ ] Bazaar / agentic.market

---

## Multi-user agents (después del demo)

- [ ] Crear wallet por usuario → fondear → registrar → pagar con *su* agente

---

## Antes de mainnet

- [ ] Persistencia real (DB / KV)
- [ ] Mainnet Base + USDC real
- [ ] No commitear secrets
