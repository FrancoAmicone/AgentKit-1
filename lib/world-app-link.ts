/**
 * Open the World verify URL exactly once.
 *
 * Do NOT call this after an await without a fresh user gesture — browsers will
 * block / spam popups. Prefer a real <a href={uri} target="_blank"> button.
 *
 * Never use location.href: it unloads StayAgent and kills the poll loop.
 */
export function openWorldAppLink(uri: string) {
  if (typeof window === "undefined" || !uri) return;
  // Single attempt only — no fallback window.open (that caused Chrome popup spam).
  window.open(uri, "_blank", "noopener,noreferrer");
}

export function isMobileDevice() {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}
