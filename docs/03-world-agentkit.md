# World AgentKit — humano detrás del agente

## Qué es (y qué no es)

**World AgentKit** ([github.com/worldcoin/agentkit](https://github.com/worldcoin/agentkit)) permite probar que un agente está respaldado por un humano verificado con **World ID**.

- **Sí hace:** ligar una wallet de agente → identificador humano anónimo (AgentBook).
- **Sí hace:** en flujos **x402**, dar free / free-trial / discount a agentes human-backed.
- **No hace:** reemplazar Coinbase AgentKit ni firmar tus swaps/transfers DeFi.
- **No es** el mismo producto que Coinbase AgentKit (solo comparten el nombre “AgentKit”).

Docs: https://docs.world.org/agents/agent-kit/integrate  
SDK ref: https://docs.world.org/agents/agent-kit/sdk-reference

## Flujo que vas a usar

```
1. Creás wallet del agente (CDP / viem)
2. Registrás esa address en AgentBook con World App
   npx @worldcoin/agentkit-cli register <agent-address>
3. El agente, al llamar APIs protegidas, usa agentkit.fetch
4. El server verifica firma + lookup AgentBook (siempre en World Chain)
5. Aplica modo: free | free-trial | discount | (si falla → pago x402 normal)
```

## Qué tenés que instalar / correr

```bash
npm install @worldcoin/agentkit

# Una vez por wallet de agente (necesitás World App en el teléfono)
npx @worldcoin/agentkit-cli register 0xTuAgente
npx @worldcoin/agentkit-cli status 0xTuAgente
```

Registro por defecto: World Chain, relay hosted (gasless). Lookup AgentBook siempre en World Chain (`eip155:480`), aunque el caller firme en Base.

## Modos de acceso (posibilidades)

| Modo | Qué brinda | Cuándo usarlo |
| --- | --- | --- |
| `free` | Human-backed pasa sin pagar | MVP interno / demo |
| `free-trial` | N usos gratis, después x402 | Producto público anti-spam |
| `discount` | Human-backed paga menos | Monetizar con preferencia humana |

Storage: `InMemoryAgentKitStorage` solo para local. Producción = DB con counters + nonces.

## Lado agente (cliente)

```ts
import { createAgentkitClient } from '@worldcoin/agentkit'

const agentkit = createAgentkitClient({
  signer: {
    address: agentWallet.address,
    chainId: 'eip155:8453', // Base
    type: 'eip191',
    signMessage: (message) => agentWallet.signMessage(message),
  },
})

// En lugar de fetch() crudo contra APIs x402:
const response = await agentkit.fetch('https://api.example.com/data')
```

## Lado server (si exponés tu propio endpoint)

Hooks de `@worldcoin/agentkit` + middleware x402 (Hono de referencia).  
Pagos aceptados en **World Chain y Base**. Facilitator World Chain de ejemplo en la doc oficial.

## Extra opcional: Human-in-the-loop

Si querés que **antes de un transfer grande** el humano apruebe con World ID:

- Docs: https://docs.world.org/agents/human-in-the-loop/integrate
- Paquete: `@worldcoin/human-in-the-loop` (+ React bindings)
- Caso: “repartí > $50 → pausar → Orb/World ID approve → ejecutar”

Para HumanSplit MVP **no es obligatorio**. AgentBook ya te da “hay un humano detrás”. HITL suma “ese humano aprobó *esta* acción”.

## Cómo encaja en HumanSplit

| Momento | Uso de World |
| --- | --- |
| Setup | Registrar wallet del agente |
| Runtime (mínimo) | Check `status` / AgentBook antes de permitir operar |
| Runtime (producto) | Endpoint “/split” protegido con free-trial para human-backed |
| Runtime (seguro) | HITL si monto > umbral |

## Qué necesitás vos

1. World App instalada y cuenta verificada (ideal Orb / PoH según lo que pida el flujo).
2. Address de la wallet del agente (la misma que firmará txs).
3. Correr el CLI de register una vez.
4. (Si server) decidir modo free-trial y dónde persistir usage/nonces.
