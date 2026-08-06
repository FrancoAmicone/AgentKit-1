import { createHash, randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import {
  AGENTBOOK_APP_ID,
  type WorldIdProofResult,
} from "@/lib/agentbook-register";

/** Same World ID app used by AgentBook CLI / StayAgent register flow */
export const HITL_APP_ID = (process.env.WORLD_ID_APP_ID ||
  AGENTBOOK_APP_ID) as `app_${string}`;

const SESSION_TTL_MS = 15 * 60 * 1000;

export type ApprovalSession = {
  sessionId: string;
  agentAddress: string;
  listingId: string;
  amountUsdc: number;
  listingTitle: string;
  action: string;
  /** For solidityEncode on the client: agent + amount in USDC micros */
  signal: { types: string[]; values: [string, string] };
  amountMicros: string;
  createdAt: string;
  expiresAt: string;
  status: "pending" | "approved" | "consumed" | "expired";
  approvalToken?: string;
  nullifierHash?: string;
};

type StoreFile = {
  sessions: Record<string, ApprovalSession>;
  /** token → sessionId */
  tokens: Record<string, string>;
};

function storePath() {
  // Demo-only persistence — /tmp is not durable across serverless instances.
  // See docs/11-demo-tradeoffs.md before “fixing” with a DB.
  if (process.env.VERCEL) {
    return "/tmp/stay-agent-approvals.json";
  }
  return join(process.cwd(), "data", "agent-approvals.json");
}

async function readStore(): Promise<StoreFile> {
  try {
    const raw = await readFile(storePath(), "utf8");
    const parsed = JSON.parse(raw) as StoreFile;
    return {
      sessions: parsed.sessions || {},
      tokens: parsed.tokens || {},
    };
  } catch {
    return { sessions: {}, tokens: {} };
  }
}

async function writeStore(store: StoreFile) {
  const path = storePath();
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(store, null, 2), "utf8");
}

function normalizeAddress(address: string) {
  return address.trim().toLowerCase();
}

function newId(prefix: string) {
  return `${prefix}_${randomBytes(12).toString("hex")}`;
}

/**
 * Prepare a one-time World ID approval bound to this agent + listing + amount.
 */
export async function createApprovalSession(input: {
  agentAddress: string;
  listingId: string;
  amountUsdc: number;
  listingTitle: string;
}): Promise<ApprovalSession> {
  const store = await readStore();
  const sessionId = newId("appr");
  const nonce = randomBytes(8).toString("hex");
  const agent = normalizeAddress(input.agentAddress);
  const amountMicros = String(Math.round(input.amountUsdc * 1e6));
  // Unique per attempt — listing is in the action string
  const action = `stay-approve-${input.listingId}-${nonce}`;
  const now = Date.now();
  const session: ApprovalSession = {
    sessionId,
    agentAddress: agent,
    listingId: input.listingId,
    amountUsdc: input.amountUsdc,
    listingTitle: input.listingTitle,
    action,
    amountMicros,
    signal: {
      types: ["address", "uint256"],
      values: [input.agentAddress, amountMicros],
    },
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + SESSION_TTL_MS).toISOString(),
    status: "pending",
  };
  store.sessions[sessionId] = session;
  await writeStore(store);
  return session;
}

export async function getApprovalSession(
  sessionId: string,
): Promise<ApprovalSession | null> {
  const store = await readStore();
  const session = store.sessions[sessionId];
  if (!session) return null;
  if (
    session.status === "pending" &&
    Date.parse(session.expiresAt) < Date.now()
  ) {
    session.status = "expired";
    store.sessions[sessionId] = session;
    await writeStore(store);
  }
  return session;
}

/**
 * After World App returns a proof for this session, mint a one-time purchase token.
 * Bridge completion already required a live World App verification for this action/signal.
 */
export async function completeApprovalSession(input: {
  sessionId: string;
  agentAddress: string;
  proof: WorldIdProofResult;
}): Promise<{ session: ApprovalSession; approvalToken: string }> {
  const store = await readStore();
  const session = store.sessions[input.sessionId];
  if (!session) throw new Error("Approval session not found");
  if (Date.parse(session.expiresAt) < Date.now()) {
    session.status = "expired";
    store.sessions[input.sessionId] = session;
    await writeStore(store);
    throw new Error("Approval session expired — start again");
  }
  if (session.status !== "pending") {
    throw new Error(`Approval session is ${session.status}`);
  }
  if (normalizeAddress(session.agentAddress) !== normalizeAddress(input.agentAddress)) {
    throw new Error("Approval session agent mismatch");
  }
  if (!input.proof?.nullifier_hash || !input.proof?.merkle_root || !input.proof?.proof) {
    throw new Error("Invalid World ID proof");
  }

  const approvalToken = newId("tok");
  session.status = "approved";
  session.approvalToken = approvalToken;
  session.nullifierHash = input.proof.nullifier_hash;
  store.sessions[input.sessionId] = session;
  store.tokens[approvalToken] = input.sessionId;
  await writeStore(store);
  return { session, approvalToken };
}

/**
 * Consume a one-time approval token for this listing/amount/agent.
 * Returns true if the over-limit purchase may proceed.
 */
export async function consumeApprovalToken(input: {
  approvalToken: string;
  agentAddress: string;
  listingId: string;
  amountUsdc: number;
}): Promise<{ ok: true; sessionId: string } | { ok: false; error: string }> {
  const store = await readStore();
  const sessionId = store.tokens[input.approvalToken];
  if (!sessionId) return { ok: false, error: "Unknown or already used approval token" };
  const session = store.sessions[sessionId];
  if (!session) return { ok: false, error: "Approval session missing" };
  if (session.status !== "approved") {
    return { ok: false, error: `Approval is ${session.status}` };
  }
  if (Date.parse(session.expiresAt) < Date.now()) {
    session.status = "expired";
    store.sessions[sessionId] = session;
    delete store.tokens[input.approvalToken];
    await writeStore(store);
    return { ok: false, error: "Approval expired — approve again" };
  }
  if (normalizeAddress(session.agentAddress) !== normalizeAddress(input.agentAddress)) {
    return { ok: false, error: "Approval agent mismatch" };
  }
  if (session.listingId !== input.listingId) {
    return { ok: false, error: "Approval listing mismatch" };
  }
  if (Math.abs(session.amountUsdc - input.amountUsdc) > 1e-9) {
    return { ok: false, error: "Approval amount mismatch" };
  }

  session.status = "consumed";
  store.sessions[sessionId] = session;
  delete store.tokens[input.approvalToken];
  await writeStore(store);
  return { ok: true, sessionId };
}

/** Stable fingerprint for logging / UI (not secret). */
export function approvalFingerprint(session: ApprovalSession): string {
  return createHash("sha256")
    .update(`${session.listingId}:${session.amountUsdc}:${session.action}`)
    .digest("hex")
    .slice(0, 12);
}
