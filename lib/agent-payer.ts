import { CdpX402Client } from "@coinbase/cdp-sdk/x402";
import { wrapFetchWithPayment, decodePaymentResponseHeader } from "@x402/fetch";

let client: CdpX402Client | null = null;
let paidFetch: typeof fetch | null = null;

/**
 * Buyer-side x402 client. Pays from a CDP-managed wallet on Base Sepolia.
 * Requires CDP_API_KEY_ID, CDP_API_KEY_SECRET, CDP_WALLET_SECRET.
 */
export function getAgentX402Client(): CdpX402Client {
  if (!client) {
    client = new CdpX402Client({
      environment: "development", // Base Sepolia
      walletConfig: {
        type: "eoa",
        accountName: "stay-agent-payer",
      },
    });
  }
  return client;
}

export async function getAgentWalletAddress(): Promise<string> {
  const { evmAddress } = await getAgentX402Client().getAddresses();
  if (process.env.AGENT_WALLET_ADDRESS && process.env.AGENT_WALLET_ADDRESS !== evmAddress) {
    console.warn(
      `[stay-agent] AGENT_WALLET_ADDRESS (${process.env.AGENT_WALLET_ADDRESS}) differs from CdpX402Client address (${evmAddress}). Using CDP client address.`,
    );
  }
  return evmAddress;
}

export function getPaidFetch(): typeof fetch {
  if (!paidFetch) {
    paidFetch = wrapFetchWithPayment(globalThis.fetch, getAgentX402Client());
  }
  return paidFetch;
}

export function readPaymentResponse(headers: Headers) {
  const raw = headers.get("payment-response") ?? headers.get("PAYMENT-RESPONSE");
  if (!raw) return null;
  try {
    return decodePaymentResponseHeader(raw);
  } catch {
    return { raw };
  }
}
