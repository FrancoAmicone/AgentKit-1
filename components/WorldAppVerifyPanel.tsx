"use client";

import { isMobileDevice } from "@/lib/world-app-link";

type WorldAppVerifyPanelProps = {
  deepLink: string;
  qrDataUrl: string | null;
};

/**
 * Single user-gesture entry into World App + QR fallback.
 * Do not auto-open windows after async work — browsers treat that as a popup.
 */
export function WorldAppVerifyPanel({
  deepLink,
  qrDataUrl,
}: WorldAppVerifyPanelProps) {
  const mobile = isMobileDevice();

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
            {mobile
              ? "Si el link abre la tienda: World App → escanear este QR."
              : "World App → escanear QR → confirmar."}
          </p>
        </div>
      )}
    </div>
  );
}
