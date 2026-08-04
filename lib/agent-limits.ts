import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

/** Floor for the owner-configurable auto-pay threshold (USDC). */
export const MIN_AUTO_PAY_LIMIT_USDC = 1;

/** Safety cap so the UI can't set an absurd limit. */
export const MAX_AUTO_PAY_LIMIT_USDC = 10_000;

export type AgentLimitConfig = {
  agentAddress: string;
  /** Max USDC the agent may spend automatically per booking. */
  autoPayLimitUsdc: number;
  updatedAt: string;
  source: "default" | "owner";
};

type StoreFile = {
  byAgent: Record<string, { autoPayLimitUsdc: number; updatedAt: string }>;
};

function normalizeAddress(address: string): string {
  return address.trim().toLowerCase();
}

function defaultLimit(): number {
  const raw = process.env.DEFAULT_AUTO_PAY_LIMIT_USDC;
  const n = raw ? Number(raw) : MIN_AUTO_PAY_LIMIT_USDC;
  if (!Number.isFinite(n)) return MIN_AUTO_PAY_LIMIT_USDC;
  return clampLimit(n);
}

export function clampLimit(value: number): number {
  return Math.min(MAX_AUTO_PAY_LIMIT_USDC, Math.max(MIN_AUTO_PAY_LIMIT_USDC, value));
}

function storePath(): string {
  // Vercel serverless FS is read-only except /tmp
  if (process.env.VERCEL) {
    return join("/tmp", "stay-agent-limits.json");
  }
  return join(process.cwd(), "data", "agent-limits.json");
}

async function readStore(): Promise<StoreFile> {
  try {
    const raw = await readFile(storePath(), "utf8");
    const parsed = JSON.parse(raw) as StoreFile;
    if (!parsed?.byAgent || typeof parsed.byAgent !== "object") {
      return { byAgent: {} };
    }
    return parsed;
  } catch {
    return { byAgent: {} };
  }
}

async function writeStore(store: StoreFile): Promise<void> {
  const path = storePath();
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(store, null, 2), "utf8");
}

export async function getAutoPayLimit(agentAddress: string): Promise<AgentLimitConfig> {
  const key = normalizeAddress(agentAddress);
  const store = await readStore();
  const row = store.byAgent[key];
  if (!row) {
    return {
      agentAddress,
      autoPayLimitUsdc: defaultLimit(),
      updatedAt: new Date(0).toISOString(),
      source: "default",
    };
  }
  return {
    agentAddress,
    autoPayLimitUsdc: clampLimit(row.autoPayLimitUsdc),
    updatedAt: row.updatedAt,
    source: "owner",
  };
}

export async function setAutoPayLimit(
  agentAddress: string,
  autoPayLimitUsdc: number,
): Promise<AgentLimitConfig> {
  if (!Number.isFinite(autoPayLimitUsdc)) {
    throw new Error("autoPayLimitUsdc must be a number");
  }
  if (autoPayLimitUsdc < MIN_AUTO_PAY_LIMIT_USDC) {
    throw new Error(`autoPayLimitUsdc must be at least ${MIN_AUTO_PAY_LIMIT_USDC} USDC`);
  }
  if (autoPayLimitUsdc > MAX_AUTO_PAY_LIMIT_USDC) {
    throw new Error(`autoPayLimitUsdc must be at most ${MAX_AUTO_PAY_LIMIT_USDC} USDC`);
  }

  const key = normalizeAddress(agentAddress);
  const store = await readStore();
  const updatedAt = new Date().toISOString();
  const value = clampLimit(autoPayLimitUsdc);
  store.byAgent[key] = { autoPayLimitUsdc: value, updatedAt };
  await writeStore(store);

  return {
    agentAddress,
    autoPayLimitUsdc: value,
    updatedAt,
    source: "owner",
  };
}

/**
 * Whether this booking amount can be paid automatically under the owner's limit.
 */
export function canAutoPay(amountUsdc: number, autoPayLimitUsdc: number): boolean {
  return amountUsdc <= autoPayLimitUsdc;
}
