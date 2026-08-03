# Posibilidades / caminos de implementación

Elegí un camino. No hace falta implementar todos.

## Camino A — MVP de aprendizaje (recomendado)

**Objetivo:** entender World + hacer 1–N transfers reales en Base.

1. Scaffold Coinbase AgentKit (LangChain, Base Sepolia).
2. Registrar la wallet del agente con World CLI.
3. Tool/script `split(amount, rule)` que hace 3 transfers.
4. Guardar recibo en JSON local.
5. Gate simple: si `agentkit-cli status` no es registered → no opera.

**Stack activo:** World AgentBook + Coinbase AgentKit + Base Sepolia  
**0G:** todavía no  
**Tiempo conceptual:** el más corto para “ver txs en el explorer”

---

## Camino B — MVP con audit en 0G

Todo lo de A, más:

6. Subir cada recibo a **0G Storage** (Galileo).
7. Devolver `rootHash` al usuario.

**Stack activo:** A + 0G Storage  
**Sirve para:** demostrar evidencia verificable fuera de tu servidor

---

## Camino C — Producto x402 “human-backed free trial”

Exponés un endpoint `/split` (o `/job`):

- Agentes human-backed: N llamadas gratis (`free-trial`)
- Otros: pagan USDC vía x402 (Base o World Chain)

El server usa hooks de `@worldcoin/agentkit`.  
El worker usa Coinbase AgentKit para ejecutar.

**Stack activo:** World AgentKit server+client + x402 + Coinbase  
**Sirve para:** anti-spam y modelo de negocio mínimo

---

## Camino D — Safe mode (human-in-the-loop)

Antes de ejecutar el split si `amount > threshold`:

- Pausar workflow
- Pedir aprobación World ID (`@worldcoin/human-in-the-loop`)
- Recién ahí firmar txs

**Stack activo:** A/B + HITL  
**Sirve para:** no tener miedo de mainnet

---

## Camino E — Agente como activo (0G Agentic ID)

1. Config + prompt + rule hasheados / encriptados.
2. Mint ERC-7857 en Galileo.
3. `authorizeUsage` para que otros usen tu splitter.
4. (Opcional) registro ERC-8004 para discovery.

**Stack activo:** B + Agentic ID (+ 8004)  
**Sirve para:** ownership / alquiler / marketplace (fase 2)

---

## Matriz rápida

| Camino | World | Base/CDP | 0G Storage | Agentic ID | x402 | HITL |
| --- | --- | --- | --- | --- | --- | --- |
| A MVP | register | yes | no | no | no | no |
| B Audit | register | yes | yes | no | no | no |
| C Producto | server+client | yes | opt | no | yes | no |
| D Safe | register+HITL | yes | opt | no | opt | yes |
| E Asset | register | yes | yes | yes | opt | opt |

## Recomendación de secuencia

```
A → B → (D si mainnet) → C o E según interés
         └─ C si te interesa monetizar / APIs
         └─ E si te interesa ownership en 0G
```

## Decisiones que hay que cerrar antes de codear

1. ¿Camino A o B como primer merge?
2. ¿Chat LLM o script determinista primero?
3. ¿Destinos del split fijos en `.env` o configurables?
4. ¿Testnet only hasta tener policy?
