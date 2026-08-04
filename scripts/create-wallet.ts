/**
 * One-time setup: create CDP wallets for the agent (payer) and marketplace (receiver),
 * then request Base Sepolia USDC for the agent.
 *
 * Usage:
 *   npm run setup:wallets
 *
 * Requires in env:
 *   CDP_API_KEY_ID
 *   CDP_API_KEY_SECRET
 *   CDP_WALLET_SECRET
 */
import { config } from "dotenv";
import { resolve } from "node:path";
import { CdpClient } from "@coinbase/cdp-sdk";

config({ path: resolve(process.cwd(), ".env.local") });
config(); // fallback .env

async function main() {
  const missing = ["CDP_API_KEY_ID", "CDP_API_KEY_SECRET", "CDP_WALLET_SECRET"].filter(
    (k) => !process.env[k],
  );
  if (missing.length) {
    console.error("Missing env vars:", missing.join(", "));
    console.error("Copy .env.example → .env.local and fill CDP credentials from portal.cdp.coinbase.com");
    process.exit(1);
  }

  const cdp = new CdpClient({
    apiKeyId: process.env.CDP_API_KEY_ID!,
    apiKeySecret: process.env.CDP_API_KEY_SECRET!,
    walletSecret: process.env.CDP_WALLET_SECRET!,
  });

  const agent = await cdp.evm.getOrCreateAccount({ name: "stay-agent-payer" });
  const marketplace = await cdp.evm.getOrCreateAccount({
    name: "stay-marketplace-receiver",
  });

  console.log("\n=== Stay Agent wallets (Base Sepolia) ===\n");
  console.log("AGENT_WALLET_ADDRESS=" + agent.address);
  console.log("MARKETPLACE_WALLET_ADDRESS=" + marketplace.address);
  console.log("\nAdd both lines to your .env.local\n");

  try {
    const faucet = await cdp.evm.requestFaucet({
      address: agent.address,
      network: "base-sepolia",
      token: "usdc",
    });
    console.log("Faucet USDC requested for agent:", faucet);
  } catch (err) {
    console.warn(
      "Could not auto-faucet USDC (rate limit or API). Fund manually:",
      err instanceof Error ? err.message : err,
    );
    console.warn("Portal faucet: https://portal.cdp.coinbase.com");
  }

  try {
    await cdp.evm.requestFaucet({
      address: agent.address,
      network: "base-sepolia",
      token: "eth",
    });
    console.log("Faucet ETH requested for agent (gas).");
  } catch {
    // optional
  }

  console.log("\nDone. Next: npm run dev\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
