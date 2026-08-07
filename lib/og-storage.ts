/**
 * Phase 3 — reservation receipts on 0G Storage (official SDK).
 *
 * Based on:
 * - https://build.0g.ai/storage
 * - https://docs.0g.ai/developer-hub/building-on-0g/storage/sdk
 * - Package: `@0gfoundation/0g-storage-ts-sdk` (not the deprecated 0g-ts-sdk)
 *
 * Soft-fail: missing OG_PRIVATE_KEY / upload errors do not fail the purchase.
 * See docs/13-env-and-0g-setup.md.
 */

import { Indexer, MemData } from "@0gfoundation/0g-storage-ts-sdk";
import { ethers } from "ethers";

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
  /** Storage Scan — verify pin / replication */
  storageScanUrl?: string;
  /** Chain explorer for the upload tx (when present) */
  explorerUrl?: string;
  network?: "testnet" | "mainnet";
  mode?: "turbo" | "standard";
  error?: string;
};

type NetworkPreset = {
  network: "testnet" | "mainnet";
  rpc: string;
  indexerTurbo: string;
  indexerStandard: string;
  chainScan: string;
};

/** Official network endpoints from 0G docs / Builder Hub. */
const NETWORKS: Record<"testnet" | "mainnet", NetworkPreset> = {
  testnet: {
    network: "testnet",
    rpc: "https://evmrpc-testnet.0g.ai",
    indexerTurbo: "https://indexer-storage-testnet-turbo.0g.ai",
    indexerStandard: "https://indexer-storage-testnet-standard.0g.ai",
    chainScan: "https://chainscan-galileo.0g.ai",
  },
  mainnet: {
    network: "mainnet",
    rpc: "https://evmrpc.0g.ai",
    indexerTurbo: "https://indexer-storage-turbo.0g.ai",
    indexerStandard: "https://indexer-storage.0g.ai",
    chainScan: "https://chainscan.0g.ai",
  },
};

const STORAGE_SCAN = "https://storagescan.0g.ai";

function resolveConfig(): {
  network: "testnet" | "mainnet";
  mode: "turbo" | "standard";
  rpc: string;
  indexerRpc: string;
  chainScan: string;
} {
  const network: "testnet" | "mainnet" =
    process.env.OG_NETWORK === "mainnet" ? "mainnet" : "testnet";
  const mode: "turbo" | "standard" =
    process.env.OG_STORAGE_MODE === "standard" ? "standard" : "turbo";
  const preset = NETWORKS[network];
  const rpc = process.env.OG_EVM_RPC || preset.rpc;
  const indexerRpc =
    process.env.OG_INDEXER_RPC ||
    (mode === "standard" ? preset.indexerStandard : preset.indexerTurbo);

  return { network, mode, rpc, indexerRpc, chainScan: preset.chainScan };
}

function privateKey(): string | null {
  const raw = process.env.OG_PRIVATE_KEY?.trim();
  if (!raw) return null;
  return raw.startsWith("0x") ? raw : `0x${raw}`;
}

function extractUploadResult(result: unknown): {
  rootHash?: string;
  txHash?: string;
} {
  if (!result || typeof result !== "object") return {};
  // Official SDK: single file → { rootHash, txHash }; fragmented → arrays
  if ("rootHash" in result && typeof (result as { rootHash: unknown }).rootHash === "string") {
    const r = result as { rootHash: string; txHash?: string };
    return { rootHash: r.rootHash, txHash: r.txHash };
  }
  if (
    "rootHashes" in result &&
    Array.isArray((result as { rootHashes: unknown }).rootHashes)
  ) {
    const r = result as { rootHashes: string[]; txHashes?: string[] };
    return { rootHash: r.rootHashes[0], txHash: r.txHashes?.[0] };
  }
  // Builder Hub quickstart sometimes documents [rootHash, err] as a string
  if (typeof result === "string") {
    return { rootHash: result };
  }
  return {};
}

/**
 * Upload a StayAgent reservation JSON to 0G Storage (MemData path).
 * Mirrors Builder Hub quickstart: Indexer + MemData + ethers Wallet.
 */
export async function uploadReservationReceipt(input: {
  reservedAt: string;
  agentAddress: string;
  listing: ReservationReceipt["listing"];
  payment: ReservationReceipt["payment"];
  world?: ReservationReceipt["world"];
}): Promise<OgUploadResult> {
  const pk = privateKey();
  if (!pk) {
    return {
      ok: false,
      skipped: true,
      error: "OG_PRIVATE_KEY not set — receipt upload skipped",
    };
  }

  const { network, mode, rpc, indexerRpc, chainScan } = resolveConfig();

  try {
    const receipt: ReservationReceipt = {
      type: "stay-agent.reservation",
      version: 1,
      reservedAt: input.reservedAt,
      agentAddress: input.agentAddress,
      listing: input.listing,
      payment: input.payment,
      world: input.world,
    };

    // In-memory payload (official MemData path — same as build.0g.ai step 04)
    const bytes = new TextEncoder().encode(JSON.stringify(receipt, null, 2));
    const file = new MemData(bytes);

    // Starter-kit gotcha: merkleTree() populates internal state before upload
    const [, treeErr] = await file.merkleTree();
    if (treeErr) {
      return {
        ok: false,
        network,
        mode,
        error: treeErr.message || String(treeErr),
      };
    }

    const provider = new ethers.JsonRpcProvider(rpc);
    const signer = new ethers.Wallet(pk, provider);
    const indexer = new Indexer(indexerRpc);

    const [tx, uploadErr] = await indexer.upload(file, rpc, signer);
    if (uploadErr) {
      console.warn("[og-storage] upload error:", uploadErr);
      return {
        ok: false,
        network,
        mode,
        error: uploadErr.message || String(uploadErr),
      };
    }

    const { rootHash, txHash } = extractUploadResult(tx);
    if (!rootHash) {
      return {
        ok: false,
        network,
        mode,
        error: "0G upload returned no rootHash",
      };
    }

    return {
      ok: true,
      rootHash,
      txHash,
      network,
      mode,
      // Builder Hub step 06 — verify on Storage Scan
      storageScanUrl: `${STORAGE_SCAN}/?rootHash=${encodeURIComponent(rootHash)}`,
      explorerUrl: txHash ? `${chainScan}/tx/${txHash}` : undefined,
    };
  } catch (err) {
    console.warn("[og-storage] upload failed:", err);
    return {
      ok: false,
      network,
      mode,
      error: err instanceof Error ? err.message : "0G upload failed",
    };
  }
}
