import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

/**
 * Shared demo JSON store.
 *
 * - Local/dev: `data/<name>.json` on disk (durable across restarts).
 * - Vercel: Runtime Cache (`@vercel/functions` getCache) — shared across
 *   serverless instances in the region. Fixes the classic "/tmp write on
 *   instance A, /stays/[id] 404 on instance B" bug for host listings.
 *
 * Still a demo store (ephemeral LRU on Vercel, not a real DB). See
 * docs/11-demo-tradeoffs.md and docs/16-host-payto-verification.md.
 */

const RUNTIME_TTL_SECONDS = 60 * 60 * 24 * 14; // 14 days

function isVercelRuntime(): boolean {
  return Boolean(process.env.VERCEL);
}

function filePath(name: string): string {
  return join(process.cwd(), "data", `${name}.json`);
}

function cacheKey(name: string): string {
  return `stay-agent:store:${name}`;
}

async function readFileJson<T>(name: string, fallback: T): Promise<T> {
  try {
    const raw = await readFile(filePath(name), "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeFileJson(name: string, value: unknown): Promise<void> {
  const path = filePath(name);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(value, null, 2), "utf8");
}

async function readRuntimeJson<T>(name: string, fallback: T): Promise<T> {
  try {
    const { getCache } = await import("@vercel/functions");
    const cache = getCache();
    const value = await cache.get(cacheKey(name));
    if (value == null) return fallback;
    if (typeof value === "string") {
      try {
        return JSON.parse(value) as T;
      } catch {
        return fallback;
      }
    }
    return value as T;
  } catch (err) {
    console.warn(`[demo-store] runtime cache read failed for ${name}:`, err);
    return fallback;
  }
}

async function writeRuntimeJson(name: string, value: unknown): Promise<void> {
  try {
    const { getCache } = await import("@vercel/functions");
    const cache = getCache();
    // Serialize to string for predictable round-trips across runtimes.
    await cache.set(cacheKey(name), JSON.stringify(value), {
      ttl: RUNTIME_TTL_SECONDS,
      tags: ["stay-agent", `stay-agent:${name}`],
      name: `stay-agent-${name}`,
    });
  } catch (err) {
    console.error(`[demo-store] runtime cache write failed for ${name}:`, err);
    throw err;
  }
}

/** Read a named JSON document from the shared demo store. */
export async function readDemoStore<T>(name: string, fallback: T): Promise<T> {
  if (isVercelRuntime()) return readRuntimeJson(name, fallback);
  return readFileJson(name, fallback);
}

/** Write a named JSON document to the shared demo store. */
export async function writeDemoStore(name: string, value: unknown): Promise<void> {
  if (isVercelRuntime()) {
    await writeRuntimeJson(name, value);
    return;
  }
  await writeFileJson(name, value);
}

/**
 * Atomic-ish update: read → mutate → write.
 * Not multi-writer safe under extreme concurrency (demo-grade).
 */
export async function updateDemoStore<T>(
  name: string,
  fallback: T,
  mutator: (current: T) => T | Promise<T>,
): Promise<T> {
  const current = await readDemoStore(name, fallback);
  const next = await mutator(current);
  await writeDemoStore(name, next);
  return next;
}
