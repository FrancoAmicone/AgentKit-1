"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createWorldBridgeStore } from "@worldcoin/idkit-core";
import { solidityEncode } from "@worldcoin/idkit-core/hashing";
import QRCode from "qrcode";

type ListingInfo = {
  id: string;
  title: string;
  amountUsdc: number;
  location?: string;
};

type PrepareResponse = {
  ok: boolean;
  approvalNeeded?: boolean;
  sessionId?: string;
  appId?: `app_${string}`;
  action?: string;
  signal?: { types: string[]; values: [string, string] };
  actionDescription?: string;
  listing?: ListingInfo;
  error?: string;
};

type CompleteResponse = {
  ok: boolean;
  approvalToken?: string;
  error?: string;
};

type Phase =
  | "idle"
  | "preparing"
  | "waiting"
  | "submitting"
  | "purchasing"
  | "done"
  | "error";

function isMobileDevice() {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

type Props = {
  open: boolean;
  listing: ListingInfo | null;
  onClose: () => void;
  onApprovedPurchase: (result: unknown) => void;
};

export function PurchaseApprovalModal({
  open,
  listing,
  onClose,
  onApprovedPurchase,
}: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [connectorURI, setConnectorURI] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const cancelRef = useRef(false);

  useEffect(() => {
    if (!open) {
      cancelRef.current = true;
      setPhase("idle");
      setMessage(null);
      setConnectorURI(null);
      setQrDataUrl(null);
      return;
    }
    setIsMobile(isMobileDevice());
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const start = useCallback(async () => {
    if (!listing) return;
    cancelRef.current = false;
    setPhase("preparing");
    setMessage(null);
    setConnectorURI(null);
    setQrDataUrl(null);

    try {
      const prepRes = await fetch("/api/agent/approve/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: listing.id }),
      });
      const prep = (await prepRes.json()) as PrepareResponse;
      if (!prepRes.ok || !prep.ok) {
        throw new Error(prep.error || "No se pudo preparar la aprobación");
      }

      if (!prep.approvalNeeded) {
        // Within limit — just purchase
        setPhase("purchasing");
        const buyRes = await fetch("/api/agent/purchase", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listingId: listing.id }),
        });
        const buy = await buyRes.json();
        if (!buyRes.ok || !buy.ok) {
          throw new Error(buy.error || "Purchase failed");
        }
        setPhase("done");
        onApprovedPurchase(buy);
        return;
      }

      if (!prep.appId || !prep.action || !prep.signal || !prep.sessionId) {
        throw new Error("Respuesta de approve/prepare incompleta");
      }

      const signal = solidityEncode(prep.signal.types, [
        prep.signal.values[0],
        BigInt(prep.signal.values[1]),
      ]);

      const worldID = createWorldBridgeStore();
      await worldID.getState().createClient({
        app_id: prep.appId,
        action: prep.action,
        signal,
        action_description:
          prep.actionDescription ||
          `Aprobar pago StayAgent $${listing.amountUsdc} USDC`,
      });

      const uri = worldID.getState().connectorURI;
      if (!uri) throw new Error("World App no devolvió link de verificación");
      if (cancelRef.current) return;

      setConnectorURI(uri);
      setPhase("waiting");
      const mobile = isMobileDevice();
      setIsMobile(mobile);
      if (mobile) {
        window.location.href = uri;
      } else {
        const dataUrl = await QRCode.toDataURL(uri, {
          width: 220,
          margin: 2,
          color: { dark: "#1a2e24", light: "#ffffff" },
        });
        if (cancelRef.current) return;
        setQrDataUrl(dataUrl);
      }

      const deadline = Date.now() + 300_000;
      while (Date.now() < deadline) {
        if (cancelRef.current) return;
        await worldID.getState().pollForUpdates();
        const { result, errorCode } = worldID.getState();
        if (errorCode) throw new Error(`World ID: ${errorCode}`);
        if (result) {
          setPhase("submitting");
          setMessage("World ID OK — emitiendo token de aprobación…");

          const completeRes = await fetch("/api/agent/approve/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId: prep.sessionId, proof: result }),
          });
          const complete = (await completeRes.json()) as CompleteResponse;
          if (!completeRes.ok || !complete.ok || !complete.approvalToken) {
            throw new Error(complete.error || "No se pudo completar la aprobación");
          }

          setPhase("purchasing");
          setMessage("Aprobado — pagando con el agente…");
          const buyRes = await fetch("/api/agent/purchase", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              listingId: listing.id,
              approvalToken: complete.approvalToken,
            }),
          });
          const buy = await buyRes.json();
          if (!buyRes.ok || !buy.ok) {
            throw new Error(buy.error || "Purchase failed after approval");
          }
          setPhase("done");
          setMessage("Reserva pagada con aprobación humana.");
          onApprovedPurchase(buy);
          return;
        }
        await new Promise((r) => setTimeout(r, 1000));
      }
      throw new Error("Se agotó el tiempo esperando World App. Reintentá.");
    } catch (err) {
      if (cancelRef.current) return;
      setPhase("error");
      setMessage(err instanceof Error ? err.message : "Error de aprobación");
    }
  }, [listing, onApprovedPurchase]);

  if (!open || !listing) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Cerrar"
        className="absolute inset-0 bg-[var(--ink)]/40 backdrop-blur-[2px]"
        onClick={() => {
          cancelRef.current = true;
          onClose();
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-[var(--line)] bg-[var(--paper)] p-5 shadow-[0_24px_80px_rgba(26,36,33,0.25)] sm:rounded-2xl sm:p-6"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--clay)]">
              Aprobación humana
            </p>
            <h2
              className="mt-1 text-2xl text-[var(--ink)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Supera el tope automático
            </h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              {listing.title} · <strong>${listing.amountUsdc} USDC</strong>
              {listing.location ? ` · ${listing.location}` : ""}
            </p>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Confirmá este gasto en World App (QR en escritorio / deep link en
              el teléfono). Después el agente paga una sola vez.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              cancelRef.current = true;
              onClose();
            }}
            className="shrink-0 rounded-lg px-2 py-1 text-sm font-semibold text-[var(--muted)] hover:bg-black/5"
          >
            Cerrar
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void start()}
            disabled={
              phase === "preparing" ||
              phase === "waiting" ||
              phase === "submitting" ||
              phase === "purchasing" ||
              phase === "done"
            }
            className="rounded-xl bg-[var(--pine)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {phase === "preparing"
              ? "Preparando…"
              : phase === "waiting"
                ? isMobile
                  ? "Esperando World App…"
                  : "Escaneá el QR…"
                : phase === "submitting"
                  ? "Confirmando…"
                  : phase === "purchasing"
                    ? "Pagando…"
                    : phase === "done"
                      ? "Listo ✓"
                      : "Aprobar con World App"}
          </button>
        </div>

        {phase === "waiting" && !isMobile && qrDataUrl && (
          <div className="mt-4">
            <img
              src={qrDataUrl}
              alt="QR aprobación World App"
              className="rounded-lg border border-[var(--line)] bg-white p-2"
              width={220}
              height={220}
            />
          </div>
        )}

        {phase === "waiting" && connectorURI && (
          <p className="mt-3 break-all text-xs text-[var(--muted)]">
            {isMobile ? (
              <>
                Si no se abrió World App,{" "}
                <a href={connectorURI} className="text-[var(--pine)] underline">
                  tocá acá
                </a>
                .
              </>
            ) : (
              <>
                Link:{" "}
                <a
                  href={connectorURI}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[var(--pine)] underline"
                >
                  abrir verificación
                </a>
              </>
            )}
          </p>
        )}

        {message && (
          <p
            className={`mt-3 text-sm ${
              phase === "error" ? "text-red-700" : "text-[var(--muted)]"
            }`}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
