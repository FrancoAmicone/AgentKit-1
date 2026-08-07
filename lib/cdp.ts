import { CdpClient } from "@coinbase/cdp-sdk";

let client: CdpClient | null = null;

/** Shared CDP client (server only). Uses CDP_API_KEY_* + CDP_WALLET_SECRET. */
export function getCdpClient(): CdpClient {
  if (!client) {
    client = new CdpClient({
      apiKeyId: process.env.CDP_API_KEY_ID,
      apiKeySecret: process.env.CDP_API_KEY_SECRET,
      walletSecret: process.env.CDP_WALLET_SECRET,
    });
  }
  return client;
}
