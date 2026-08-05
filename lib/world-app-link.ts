/**
 * Open World App verify URL without navigating away from StayAgent.
 * Using location.href kills the SPA poll loop and often drops users in the
 * App Store / Play Store instead of the installed World App.
 */
export function openWorldAppLink(uri: string) {
  if (typeof window === "undefined" || !uri) return;

  // Prefer a user-gesture <a target=_blank> so iOS/Android can hand off to the
  // installed app via Universal Link / App Link while our tab keeps polling.
  const a = document.createElement("a");
  a.href = uri;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();

  // Fallback if popup / blank tab was blocked
  window.setTimeout(() => {
    try {
      window.open(uri, "_blank", "noopener,noreferrer");
    } catch {
      // ignore
    }
  }, 250);
}

export function isMobileDevice() {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}
