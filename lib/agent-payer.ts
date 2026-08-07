import { CdpX402Client } from "@coinbase/cdp-sdk/x402";
import { wrapFetchWithPayment, decodePaymentResponseHeader } from "@x402/fetch";
import { getSessionAccountName } from "@/lib/agent-session";

const clients = new Map<string, CdpX402Client>();
const paidFetches = new Map<string, typeof fetch>();

function x402Environment(): "production" | "development" {
  return process.env.CDP_X402_CLIENT_ENVIRONMENT === "production"
    ? "production"
    : "development";
}

/**
 * Buyer-side x402 client for a named CDP EOA.
 * Requires CDP_API_KEY_ID, CDP_API_KEY_SECRET, CDP_WALLET_SECRET.
 */
export function getAgentX402Client(accountName: string): CdpX402Client {
  let client = clients.get(accountName);
  if (!client) {
    client = new CdpX402Client({
      environment: x402Environment(),
      walletConfig: {
        type: "eoa",
        accountName,
      },
    });
    clients.set(accountName, client);
  }
  return client;
}

export async function getAgentWalletAddress(
  accountName?: string,
): Promise<string> {
  const name = accountName ?? (await getSessionAccountName());
  if (!name) {
    throw Object.assign(new Error("No agent wallet yet — create one in Configurar"), {
      code: "AGENT_NOT_CREATED",
    });
  }
  const { evmAddress } = await getAgentX402Client(name).getAddresses();
  return evmAddress;
}

export function getPaidFetch(accountName: string): typeof fetch {
  let paid = paidFetches.get(accountName);
  if (!paid) {
    paid = wrapFetchWithPayment(
      globalThis.fetch,
      getAgentX402Client(accountName),
    );
    paidFetches.set(accountName, paid);
  }
  return paid;
}

/** Resolve session account + paid fetch, or throw AGENT_NOT_CREATED. */
export async function getSessionPaidFetch(): Promise<{
  accountName: string;
  address: string;
  paidFetch: typeof fetch;
}> {
  const accountName = await getSessionAccountName();
  if (!accountName) {
    throw Object.assign(new Error("No agent wallet yet — create one in Configurar"), {
      code: "AGENT_NOT_CREATED",
    });
  }
  const address = await getAgentWalletAddress(accountName);
  return {
    accountName,
    address,
    paidFetch: getPaidFetch(accountName),
  };
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
