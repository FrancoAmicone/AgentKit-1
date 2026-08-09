import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Anonymous host identity: one cookie per browser, same pattern as the
 * buyer-side agent session (see docs/12-multiuser-and-0g.md, open question 1).
 */
export const HOST_ID_COOKIE = "stay_host_id";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 400; // ~13 months

function isValidHostId(value: string): boolean {
  return /^host_[a-f0-9]{24}$/.test(value);
}

export async function getHostId(): Promise<string | null> {
  const jar = await cookies();
  const value = jar.get(HOST_ID_COOKIE)?.value?.trim();
  return value && isValidHostId(value) ? value : null;
}

/** Returns the existing host id or mints + sets a new one. */
export async function getOrCreateHostId(): Promise<string> {
  const existing = await getHostId();
  if (existing) return existing;
  const hostId = `host_${randomBytes(12).toString("hex")}`;
  const jar = await cookies();
  jar.set(HOST_ID_COOKIE, hostId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
  return hostId;
}
