# Idea — ¿Qué problema resolvemos?

## El problema actual

Hoy cualquiera puede levantar un bot con wallet y decir “soy un agente útil”. El costo de crear agentes es casi cero. Eso genera:

1. **Spam / abuso** — bots que consumen APIs, free trials y faucets.
2. **Falta de accountability** — si un agente mueve plata mal, no sabés si hay un humano responsable.
3. **Desconfianza** — para pagar o tippear a un agente, necesitás una señal de “hay un humano único detrás”, no solo una clave privada.

World AgentKit ataca exactamente eso: **probar que el agente está respaldado por un humano único (World ID)**, sin revelar quién es.

## Idea simple: **HumanSplit**

> Un agente que **reparte pagos onchain automáticamente**, pero solo puede operar si está **registrado como human-backed** en World AgentBook. Cada acción queda auditada.

### Necesidad puntual

Llega USDC (freelance, tip, venta, stipend). Vos querés que se reparta solo:

- 70% ahorro
- 20% gastos
- 10% socio / tip

Sin hacerlo a mano cada vez. Y querés poder demostrar (a vos, a un socio, a un cliente) que **ese agente no es un bot anónimo suelto**.

### Qué hace el agente por sí solo

1. Detecta un depósito (o recibe una orden: “repartí estos 100 USDC”).
2. Verifica que su wallet está en AgentBook (humano detrás).
3. Aplica la regla de split.
4. Ejecuta transfers reales onchain (Base testnet → luego mainnet).
5. Guarda un recibo inmutable (quién, cuánto, a dónde, tx hash).

### Por qué esta idea sirve para aprender

| Objetivo tuyo | Cómo lo cubre |
| --- | --- |
| Aprender World AgentKit | Registro AgentBook + verificación en requests |
| Hacer txs onchain reales | Transfers USDC con Coinbase AgentKit en Base |
| Usar 0G | Audit trail / memoria en Storage; opcional Agentic ID |
| Mantenerlo simple | Una sola acción autónoma: **split** |

### Qué NO es (a propósito)

- No es un yield optimizer complejo.
- No es un marketplace de agentes (puede ser fase 2).
- No es un chat genérico “hacé lo que quieras onchain”.

Una necesidad. Una acción. Tres capas de stack con roles claros.

## Variantes del mismo problema (si querés pivotear)

| Variante | Necesidad | Acción autónoma |
| --- | --- | --- |
| **A. HumanSplit** (recomendada) | Repartir pagos | Transfers según regla |
| **B. HumanTip gate** | Cobrar tips solo a agentes human-backed | Endpoint x402 + free-trial World |
| **C. Approved payout** | Mover plata solo con OK humano | Human-in-the-loop + transfer |
| **D. Job + receipt** | Agente hace un job pago y deja prueba | x402 pay → acción → receipt 0G |

Todas usan World para confianza humana. Coinbase/Base para mover plata. 0G para evidencia / identidad.

## Criterio de éxito del MVP

- [ ] Wallet del agente registrada en AgentBook con World ID
- [ ] Una regla de split configurable
- [ ] Al menos 2 transfers onchain reales en **Base Sepolia** (o Base mainnet con montos chicos)
- [ ] Un recibo guardado (archivo local primero; 0G Storage después)
- [ ] Si la wallet no está human-backed → el flujo se corta o no da beneficios

## Decisión abierta (para debatir)

1. ¿El agente actúa **solo al detectar depósito**, o solo cuando vos le pedís por chat?
2. ¿La plata vive en wallet CDP (Coinbase) o en una clave local?
3. ¿0G es obligatorio desde el día 1 (receipts) o fase 2 (Agentic ID)?

Recomendación de arranque: **chat/comando dispara el split** (más simple que indexar depósitos), wallet **CDP en Base Sepolia**, 0G Storage como **fase 1.5** (receipt), Agentic ID como **fase 2**.
