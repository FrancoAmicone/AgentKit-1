/**
 * Open the World verify URL without unloading StayAgent (that would kill the
 * Bridge poll loop). Prefer a real <a target="_blank"> or a window reserved
 * synchronously in the user-gesture click handler.
 */

export type MobilePlatform = "ios" | "android" | "other";

/** Official World App store listings (Tools for Humanity). */
export const WORLD_APP_STORE = {
  ios: "https://apps.apple.com/app/world-app/id1560859847",
  android: "https://play.google.com/store/apps/details?id=com.worldcoin",
} as const;

export function isMobileDevice() {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

export function getMobilePlatform(): MobilePlatform | null {
  if (!isMobileDevice()) return null;
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "other";
}

/** App Store (iOS) or Play Store (Android). Fallback: Play Store listing. */
export function getWorldAppStoreUrl(): string {
  const platform = getMobilePlatform();
  if (platform === "ios") return WORLD_APP_STORE.ios;
  return WORLD_APP_STORE.android;
}

export function openWorldAppLink(uri: string) {
  if (typeof window === "undefined" || !uri) return false;
  const win = window.open(uri, "_blank", "noopener,noreferrer");
  return Boolean(win);
}

/**
 * Call synchronously inside a click/tap handler (before any await).
 * We navigate this tab to the verify URI once Bridge is ready so mobile
 * browsers don't treat it as a blocked popup.
 */
export function reserveWorldAppWindow(): Window | null {
  if (typeof window === "undefined") return null;
  try {
    return window.open("about:blank", "_blank");
  } catch {
    return null;
  }
}

/** Point a reserved window at the World verify URI (or open a fresh one). */
export function navigateWorldAppWindow(
  reserved: Window | null | undefined,
  uri: string,
): boolean {
  if (!uri) return false;
  if (reserved && !reserved.closed) {
    try {
      reserved.location.href = uri;
      return true;
    } catch {
      // fall through
    }
  }
  return openWorldAppLink(uri);
}

export function closeReservedWindow(reserved: Window | null | undefined) {
  if (!reserved || reserved.closed) return;
  try {
    reserved.close();
  } catch {
    // ignore
  }
}
