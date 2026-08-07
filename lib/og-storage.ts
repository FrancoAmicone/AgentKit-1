/**
 * Phase 3 — upload reservation receipts to 0G Storage (Galileo testnet).
 *
 * Soft-fail: if OG_PRIVATE_KEY is missing or upload fails, purchase still succeeds.
 * See docs/13-env-and-0g-setup.md for faucet / env setup.
 */

export type ReservationReceipt = {
  type: "stay-agent.reservation";
  version: 1;
  reservedAt: string;
  agentAddress: string;
  listing: {
    id: string;
    title: string;
    location: string;
    amountUsdc: number;
  };
  payment: {
    txHash?: string;
    network: "base-sepolia";
    usedHumanApproval: boolean;
  };
  world?: {
    humanId?: string | null;
    hitlAction?: string;
  };
};

export type OgUploadResult = {
  ok: boolean;
  skipped?: boolean;
  rootHash?: string;
  txHash?: string;
  explorerUrl?: string;
  error?: string;
};

const DEFAULT_RPC = "https://evmrpc-testnet.0g.ai";
const DEFAULT_INDEXER = "https://indexer-storage-testnet-turbo.0g.ai";

function ogEnabled(): boolean {
  return Boolean(process.env.OG_PRIVATE_KEY?.trim());
}

export async function uploadReservationReceipt(input: {
  reservedAt: string;
  agentAddress: string;
  listing: ReservationReceipt["listing"];
  payment: ReservationReceipt["payment"];
  world?: ReservationReceipt["world"];
}): Promise<OgUploadResult> {
  if (!ogEnabled()) {
    return {
      ok: false,
      skipped: true,
      error: "OG_PRIVATE_KEY not set — receipt upload skipped",
    };
  }

  try {
    const { Indexer, MemData } = await import("@0gfoundation/0g-ts-sdk");
    const { ethers } = await import("ethers");

    const rpc = process.env.OG_EVM_RPC || DEFAULT_RPC;
    const indexerUrl = process.env.OG_INDEXER_RPC || DEFAULT_INDEXER;
    const pk = process.env.OG_PRIVATE_KEY!.trim();

    const receipt: ReservationReceipt = {
      type: "stay-agent.reservation",
      version: 1,
      reservedAt: input.reservedAt,
      agentAddress: input.agentAddress,
      listing: input.listing,
      payment: input.payment,
      world: input.world,
    };

    const bytes = new TextEncoder().encode(JSON.stringify(receipt, null, 2));
    const file = new MemData(bytes);

    const provider = new ethers.JsonRpcProvider(rpc);
    const signer = new ethers.Wallet(pk, provider);
    const indexer = new Indexer(indexerUrl);

    const [result, err] = await indexer.upload(file, rpc, signer);
    if (err) {
      console.warn("[og-storage] upload error:", err);
      return {
        ok: false,
        error: err.message || String(err),
      };
    }

    const rootHash =
      result && "rootHash" in result
        ? result.rootHash
        : result && "rootHashes" in result
          ? result.rootHashes[0]
          : undefined;
    const txHash =
      result && "txHash" in result
        ? result.txHash
        : result && "txHashes" in result
          ? result.txHashes[0]
          : undefined;

    return {
      ok: true,
      rootHash,
      txHash,
      explorerUrl: rootHash
        ? `https://chainscan-galileo.0g.ai/tx/${txHash || ""}`
        : undefined,
    };
  } catch (err) {
    console.warn("[og-storage] upload failed:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "0G upload failed",
    };
  }
}
