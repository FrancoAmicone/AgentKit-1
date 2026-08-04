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

## Fase 2 — World ID (siguiente si querés identidad humana)

- [ ] World App en el teléfono
- [ ] `npm install @worldcoin/agentkit`
- [ ] `npx @worldcoin/agentkit-cli register <AGENT_WALLET_ADDRESS>`
- [ ] `status` → registered
- [ ] Regla: si pago > umbral → pedir re-verificación World ID
- [ ] (Opcional) Human-in-the-loop antes de confirmar

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
