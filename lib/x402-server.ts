import { createCdpFacilitatorClient } from "@coinbase/cdp-sdk/x402";
import { x402ResourceServer } from "@x402/core/server";
import { ExactEvmScheme } from "@x402/evm/exact/server";

/** Base Sepolia (CAIP-2) */
export const BASE_SEPOLIA = "eip155:84532";

let serverPromise: Promise<x402ResourceServer> | null = null;
let synced = false;

export function getMarketplacePayTo(): `0x${string}` {
  const addr = process.env.MARKETPLACE_WALLET_ADDRESS;
  if (!addr || !/^0x[a-fA-F0-9]{40}$/.test(addr)) {
    throw new Error(
      "MARKETPLACE_WALLET_ADDRESS missing or invalid. Run: npm run setup:wallets",
    );
  }
  return addr as `0x${string}`;
}

/**
 * Shared x402 resource server (CDP facilitator + Exact scheme on Base Sepolia).
 */
export async function getX402ResourceServer(): Promise<x402ResourceServer> {
  if (!serverPromise) {
    serverPromise = Promise.resolve(
      new x402ResourceServer(createCdpFacilitatorClient()).register(
        BASE_SEPOLIA,
        new ExactEvmScheme(),
      ),
    );
  }
  return serverPromise;
}

export function shouldSyncFacilitator(): boolean {
  if (synced) return false;
  synced = true;
  return true;
}
