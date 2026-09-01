import { createWorldBridgeStore } from "@worldcoin/idkit-core";
import { solidityEncode } from "@worldcoin/idkit-core/hashing";
import QRCode from "qrcode";

export type WorldBridgeProof = {
  proof: string;
  merkle_root: string;
  nullifier_hash: string;
  verification_level?: string;
};

export type WorldBridgeSessionInput = {
  appId: `app_${string}`;
  action: string;
  /** ABI types for solidityEncode — StayAgent uses address + uint256 */
  signalTypes: string[];
  /** Parallel values; uint256 fields as decimal strings */
  signalValues: unknown[];
  actionDescription?: string;
};

export type WorldBridgeReady = {
  connectorURI: string;
  qrDataUrl: string | null;
};

function assertNotAborted(signal: AbortSignal) {
  if (signal.aborted) {
    const err = new Error("Aborted");
    err.name = "AbortError";
    throw err;
  }
}

/**
 * Create a World Bridge verification session and poll until proof or abort/timeout.
 *
 * Best practice: call this after a user gesture starts the flow, then expose
 * `connectorURI` via a real <a target="_blank"> — do not auto-open after await
 * (browsers treat that as a blocked popup). On mobile, reserve a window in the
 * click handler and navigate it when `onReady` fires.
 */
export async function waitForWorldBridgeProof(
  input: WorldBridgeSessionInput,
  options: {
    signal: AbortSignal;
    onReady: (ready: WorldBridgeReady) => void;
    pollIntervalMs?: number;
    timeoutMs?: number;
    /** Skip QR generation (default: skip on mobile). */
    includeQr?: boolean;
  },
): Promise<WorldBridgeProof> {
  const pollIntervalMs = options.pollIntervalMs ?? 1200;
  const timeoutMs = options.timeoutMs ?? 300_000;
  const includeQr =
    options.includeQr ??
    !(typeof navigator !== "undefined" &&
      /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent));

  assertNotAborted(options.signal);

  const encodedSignal = solidityEncode(input.signalTypes, input.signalValues.map((v, i) => {
    // uint256 fields arrive as decimal strings from our APIs
    if (input.signalTypes[i] === "uint256" && typeof v === "string") {
      return BigInt(v);
    }
    return v;
  }));

  const store = createWorldBridgeStore();
  await store.getState().createClient({
    app_id: input.appId,
    action: input.action,
    signal: encodedSignal,
    action_description: input.actionDescription,
  });

  assertNotAborted(options.signal);

  const connectorURI = store.getState().connectorURI;
  if (!connectorURI) {
    throw new Error("World App no devolvió link de verificación");
  }

  const qrDataUrl = includeQr
    ? await QRCode.toDataURL(connectorURI, {
        width: 220,
        margin: 2,
        color: { dark: "#1a2e24", light: "#ffffff" },
      })
    : null;

  assertNotAborted(options.signal);
  options.onReady({ connectorURI, qrDataUrl });

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    assertNotAborted(options.signal);

    try {
      await store.getState().pollForUpdates();
    } catch {
      await sleep(pollIntervalMs, options.signal);
      continue;
    }

    const { result, errorCode } = store.getState();
    if (errorCode) {
      throw new Error(
        errorCode === "connection_failed"
          ? "connection_failed"
          : `World ID: ${errorCode}`,
      );
    }
    if (result) {
      return result as WorldBridgeProof;
    }
    await sleep(pollIntervalMs, options.signal);
  }

  throw new Error("Se agotó el tiempo esperando World App. Reintentá.");
}

function sleep(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) {
      const err = new Error("Aborted");
      err.name = "AbortError";
      reject(err);
      return;
    }
    const t = window.setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    function onAbort() {
      window.clearTimeout(t);
      const err = new Error("Aborted");
      err.name = "AbortError";
      reject(err);
    }
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

export function isAbortError(err: unknown): boolean {
  return err instanceof Error && err.name === "AbortError";
}
