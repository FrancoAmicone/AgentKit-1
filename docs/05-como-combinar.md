# Cuándo usar 1, 2 o 3

No hay obligación de combinar World + 0G + Coinbase. Empezá por el problema; sumá piezas solo si aportan.

## Una sola pieza

| Si el núcleo es… | Empezá con | Ejemplo |
| --- | --- | --- |
| Anti-sybil / humano único | **World** | Claim o rifa “1 humano = 1 entrada” (payout puede ser manual al principio) |
| Mover plata / DeFi en Base | **Coinbase AgentKit** | Chat que hace transfer/swap en Sepolia |
| Memoria, ownership del agente, AI infra | **0G** | Guardar estado, mintear Agentic ID |

## Dos piezas (combinaciones útiles)

| Combo | Para qué |
| --- | --- |
| **World + Coinbase** | Human-backed **y** payout/txs automáticos (claims, bounties, rifas) |
| **World + 0G** | Identidad humana + evidencia/memoria; payout después o manual |
| **Coinbase + 0G** | Agente que opera en Base y deja audit en Storage (sin capa anti-sybil) |

## Tres piezas

Solo si el producto necesita las tres preguntas a la vez:

1. ¿Hay humano detrás? → World  
2. ¿Movemos fondos con buena DX? → Coinbase/Base  
3. ¿Guardamos evidencia / tokenizamos el agente? → 0G  

Si alguna pregunta es “no”, esa pieza puede esperar.

## Mapa idea → stack tentativo

(Se ajusta cuando cerremos la idea.)

| Idea | Mínimo viable | Suma después |
| --- | --- | --- |
| One Claim | World (+ payout simple) | Coinbase para automatizar; 0G log |
| Bounty inbox | World + escrow/payout | 0G delivery |
| Data buyer x402 | World + x402 | Base settlement; 0G cache |
| Rifa / allowlist | World + sorteo onchain | Coinbase payout |
| Gastos + HITL | World HITL + Coinbase | 0G audit |
| Attestation | World + registro | 0G Storage y/o badge onchain |

## Regla práctica

> Scaffold **una** pieza primero hasta ver algo funcionando. Recién ahí enchufá la segunda.
