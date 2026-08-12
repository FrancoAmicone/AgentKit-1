import { isEvmAddress } from "./host-listings";
import { readDemoStore, writeDemoStore } from "./demo-store";

/**
 * Host-level profile: the payout wallet a host registers ONCE and that
 * anchors to every property they publish. Resolution order for a listing's
 * payTo (see lib/listings.ts):
 *
 *   1. per-listing override (payoutAddress on the listing)
 *   2. host profile wallet (this store)
 *   3. marketplace wallet (single-wallet default of the demo)
 */
export type HostProfile = {
  hostId: string;
  payoutAddress?: string;
  updatedAt: string;
};

type StoreFile = {
  byHost: Record<string, { payoutAddress?: string; updatedAt: string }>;
};

const STORE_NAME = "host-profiles";
const EMPTY: StoreFile = { byHost: {} };

async function readStore(): Promise<StoreFile> {
  const parsed = await readDemoStore<StoreFile>(STORE_NAME, EMPTY);
  if (!parsed?.byHost || typeof parsed.byHost !== "object") return EMPTY;
  return parsed;
}

async function writeStore(store: StoreFile): Promise<void> {
  await writeDemoStore(STORE_NAME, store);
}

export async function getHostProfile(hostId: string): Promise<HostProfile | null> {
  const store = await readStore();
  const row = store.byHost[hostId];
  if (!row) return null;
  return { hostId, payoutAddress: row.payoutAddress, updatedAt: row.updatedAt };
}

/** All profiles at once, for resolving payTo across the catalog in one read. */
export async function getAllHostProfiles(): Promise<Map<string, HostProfile>> {
  const store = await readStore();
  return new Map(
    Object.entries(store.byHost).map(([hostId, row]) => [
      hostId,
      { hostId, payoutAddress: row.payoutAddress, updatedAt: row.updatedAt },
    ]),
  );
}

/**
 * Register / update the host's payout wallet. Empty string clears it
 * (back to the marketplace single-wallet default).
 */
export async function setHostPayoutWallet(
  hostId: string,
  payoutAddress: string,
): Promise<HostProfile> {
  const trimmed = payoutAddress.trim();
  if (trimmed && !isEvmAddress(trimmed)) {
    throw new Error("La wallet de cobro debe ser una dirección EVM válida (0x…).");
  }
  const store = await readStore();
  const updatedAt = new Date().toISOString();
  store.byHost[hostId] = {
    payoutAddress: trimmed || undefined,
    updatedAt,
  };
  await writeStore(store);
  return { hostId, payoutAddress: trimmed || undefined, updatedAt };
}
