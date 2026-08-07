import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";

export const AGENT_ACCOUNT_COOKIE = "stay_agent_account";

/** Shared demo payer — only when DEMO_SHARED_AGENT=true. */
export const SHARED_DEMO_ACCOUNT_NAME = "stay-agent-payer";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 400; // ~13 months

export function isDemoSharedAgentEnabled(): boolean {
  return process.env.DEMO_SHARED_AGENT === "true";
}

/** CDP account names: letters, numbers, hyphens. */
export function makeAgentAccountName(): string {
  const id = randomBytes(12).toString("hex");
  return `stay-${id}`;
}

export function isValidAccountName(name: string): boolean {
  return /^stay-[a-z0-9-]{8,48}$/i.test(name) || name === SHARED_DEMO_ACCOUNT_NAME;
}

export async function getSessionAccountName(): Promise<string | null> {
  const jar = await cookies();
  const value = jar.get(AGENT_ACCOUNT_COOKIE)?.value?.trim();
  if (value && isValidAccountName(value)) return value;
  if (isDemoSharedAgentEnabled()) return SHARED_DEMO_ACCOUNT_NAME;
  return null;
}

export async function setSessionAccountName(accountName: string): Promise<void> {
  if (!isValidAccountName(accountName)) {
    throw new Error("Invalid agent account name");
  }
  const jar = await cookies();
  jar.set(AGENT_ACCOUNT_COOKIE, accountName, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

/**
 * Resolve the CDP account for this request, or null if the user must create one.
 */
export async function requireSessionAccountName(): Promise<string | null> {
  return getSessionAccountName();
}
