# Checklist — StayAgent

## Higiene de docs

Cada vez que se termina una tarea: **actualizar este checklist + docs de la fase** en el mismo cambio (no dejarlo para después).

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

### Debug (ya no bloquea)

- [x] Faucet / saldo agente resuelto (precios demo $0.05 / $0.2)
- [x] Pago x402 end-to-end en Base Sepolia

**Fase 1: DONE**

---

## Fase 2A — AgentBook gate (solo agente que compra)

Ver [08-phase2-agentbook.md](./08-phase2-agentbook.md).

- [x] Código: gate en `/api/agent/purchase` + `/api/agent/status` + UI
- [x] Marketplace/receiver **sin** verificación (by design)
- [x] Registro in-app: World App QR (desktop) / deep link (mobile)
- [x] Popup **Configurar** (verificación + tope); registro solo si falta
- [x] World App + registro del agente demo → badge **Human-backed ✓**
- [x] Probar: con registro → paga ($0.05 bajo tope)
- [ ] (Opcional) Probar sin registro / otro entorno → 403 `AGENT_NOT_HUMAN_BACKED`

**Fase 2A: DONE** (demo compartida: una wallet CDP registrada al dueño)

---

## Fase 2B — Auto-pay limit (dueño del agente)

Ver [09-phase2b-autopay-limit.md](./09-phase2b-autopay-limit.md).

- [x] Código: `GET/POST /api/agent/limits` + gate en purchase + UI (modal)
- [x] Mínimo configurable: **$0.01 USDC**; default hardcodeado **$0.1**
- [x] Catálogo demo: varios **$0.05** (bajo tope) + varios **$0.2** (sobre tope)
- [x] Guardar tope en UI ($0.1) y pagar listing $0.05
- [ ] Probar listing **$0.2** → `NEEDS_HUMAN_APPROVAL` (o subir tope)

**Fase 2B: código DONE** — falta validar el bloqueo $0.2 en prod si aún no se probó

---

## Fase 2C — Human-in-the-loop

- [ ] Cuando `price > tope`, pedir aprobación humana (World HITL) antes de pagar
- [ ] UI de “aprobar gasto alto” end-to-end

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

## Multi-user agents (después del demo)

Hoy todos usan la misma wallet CDP (`stay-agent-payer`) ya registrada.

- [ ] Crear wallet de agente por usuario
- [ ] Fondear esa wallet
- [ ] Registrar cada wallet en AgentBook con el World ID del dueño
- [ ] Pagar / tope por agente (no compartir el del demo)

---

## Antes de mainnet (más adelante)

- [ ] Persistencia real de reservas (DB; hoy es in-memory)
- [ ] Persistencia real de límites (KV/DB; hoy file/`/tmp`)
- [ ] Confirmación explícita / HITL para montos altos (2C)
- [ ] Mainnet Base + USDC real (solo cuando policy esté lista)
- [ ] No commitear secrets; rotar keys si se filtraron
