"use client";

import { useEffect, useRef, useState } from "react";
import {
  getMobilePlatform,
  getWorldAppStoreUrl,
  isMobileDevice,
  openWorldAppLink,
} from "@/lib/world-app-link";

type WorldAppVerifyPanelProps = {
  deepLink: string;
  /** Desktop only — ignored on phones (QR is useless when you're already on the phone). */
  qrDataUrl?: string | null;
  /**
   * When true (default on mobile), attempt to open World App as soon as the
   * link is ready. Parents should prefer `reserveWorldAppWindow` on tap for
   * better popup survival; this is the fallback.
   */
  autoOpen?: boolean;
};

/**
 * World verification entry:
 * - Desktop: Abrir World App + QR to scan from the phone
 * - Mobile: open World App directly (no QR). If the app isn't installed,
 *   offer / fall through to App Store or Play Store for that OS.
 */
export function WorldAppVerifyPanel({
  deepLink,
  qrDataUrl,
  autoOpen,
}: WorldAppVerifyPanelProps) {
  const mobile = isMobileDevice();
  const platform = getMobilePlatform();
  const storeUrl = getWorldAppStoreUrl();
  const shouldAutoOpen = autoOpen ?? mobile;
  const openedRef = useRef(false);
  const [suggestStore, setSuggestStore] = useState(false);

  useEffect(() => {
    if (!shouldAutoOpen || !deepLink || openedRef.current) return;
    openedRef.current = true;
    openWorldAppLink(deepLink);

    // If we're still foregrounded shortly after, the deep link likely didn't
    // hand off to World App (not installed / blocked). Surface the store.
    const timer = window.setTimeout(() => {
      if (document.visibilityState === "visible") {
        setSuggestStore(true);
      }
    }, 1800);

    const onVis = () => {
      if (document.visibilityState === "hidden") {
        setSuggestStore(false);
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [deepLink, shouldAutoOpen]);

  const storeLabel =
    platform === "ios"
      ? "Instalar World App (App Store)"
      : platform === "android"
        ? "Instalar World App (Play Store)"
        : "Instalar World App";

  if (mobile) {
    return (
      <div className="mt-4 space-y-3">
        <p className="text-xs leading-relaxed text-[var(--muted)]">
          En el teléfono abrimos World App directo. Si no la tenés instalada,
          usá el link de la tienda.
        </p>
        <a
          href={deepLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center bg-[var(--pine)] px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-[var(--pine-deep)]"
        >
          Abrir World App
        </a>
        <a
          href={storeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex w-full items-center justify-center border px-4 py-3 text-center text-sm font-semibold transition ${
            suggestStore
              ? "border-[var(--clay)] bg-[var(--clay)] text-white"
              : "border-[var(--line)] bg-[var(--surface-strong)] text-[var(--ink)] hover:border-[var(--pine)]/50"
          }`}
        >
          {storeLabel}
        </a>
        {suggestStore && (
          <p className="text-xs leading-relaxed text-[var(--clay)]">
            Parece que World App no se abrió. Instalála y volvé a tocar
            “Abrir World App”.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      <a
        href={deepLink}
        target="_blank"
        rel="noopener noreferrer"
        className="flex w-full items-center justify-center bg-[var(--pine)] px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-[var(--pine-deep)]"
      >
        Abrir World App
      </a>
      {qrDataUrl && (
        <div className="border border-[var(--line)] bg-[var(--surface-strong)] p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrDataUrl}
            alt="QR World App"
            className="mx-auto block"
            width={220}
            height={220}
          />
          <p className="mt-2 text-center text-xs text-[var(--muted)]">
            World App → escanear QR → confirmar.
          </p>
        </div>
      )}
    </div>
  );
}
