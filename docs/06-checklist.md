# Checklist de setup

Completar **después** de elegir idea y piezas. Por ahora es referencia.

## Si usamos World AgentKit

- [ ] World App en el teléfono
- [ ] `npm install @worldcoin/agentkit`
- [ ] Address de la wallet del agente
- [ ] `npx @worldcoin/agentkit-cli register <address>`
- [ ] `status` → registered
- [ ] (Opcional HITL) app en https://developer.world.org → `WORLD_RP_ID`, signing key, `app_id`

## Si usamos Coinbase AgentKit

- [ ] Cuenta https://portal.cdp.coinbase.com
- [ ] CDP Secret API Key
- [ ] API key LLM (si hay chat)
- [ ] `npm create onchain-agent@latest` o integrar en este repo
- [ ] `NETWORK_ID=base-sepolia` + primer tx en explorer

## Si usamos 0G

- [ ] Red Galileo (chainId `16602`, RPC `https://evmrpc-testnet.0g.ai`)
- [ ] Faucet https://faucet.0g.ai
- [ ] Probar Storage starter kit
- [ ] (Opcional) `agenticID-examples` para mint

## Seguridad (si hay fondos)

- [ ] Allowlist de destinos / actions
- [ ] Límites de monto
- [ ] Logs de cada tx
- [ ] Testnet antes de mainnet
