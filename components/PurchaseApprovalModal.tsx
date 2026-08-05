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
  | "ask"
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
  /** Current auto-pay tope, for the Yes/No copy */
  autoPayLimitUsdc?: number;
  onClose: () => void;
  onApprovedPurchase: (result: unknown) => void;
};

export function PurchaseApprovalModal({
  open,
  listing,
  autoPayLimitUsdc,
  onClose,
  onApprovedPurchase,
}: Props) {
  const [phase, setPhase] = useState<Phase>("ask");
  const [message, setMessage] = useState<string | null>(null);
  const [connectorURI, setConnectorURI] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const cancelRef = useRef(false);

  useEffect(() => {
    if (!open) {
      cancelRef.current = true;
      setPhase("ask");
      setMessage(null);
      setConnectorURI(null);
      setQrDataUrl(null);
      return;
    }
    cancelRef.current = false;
    setPhase("ask");
    setMessage(null);
    setConnectorURI(null);
    setQrDataUrl(null);
    setIsMobile(isMobileDevice());
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open, listing?.id]);

  const startWorldApproval = useCallback(async () => {
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
          setMessage("Confirmado en World App — pagando…");

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
          setMessage("Reserva pagada con tu aprobación.");
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

  const limitLabel =
    autoPayLimitUsdc != null ? `$${autoPayLimitUsdc}` : "tu tope";

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
        aria-labelledby="hitl-title"
        className="relative z-10 max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-[var(--line)] bg-[var(--paper)] p-5 shadow-[0_24px_80px_rgba(26,36,33,0.25)] sm:rounded-2xl sm:p-6"
      >
        {phase === "ask" && (
          <>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--clay)]">
              Tope automático
            </p>
            <h2
              id="hitl-title"
              className="mt-1 text-2xl text-[var(--ink)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              ¿Aprobás este gasto?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              <strong className="text-[var(--ink)]">{listing.title}</strong> cuesta{" "}
              <strong className="text-[var(--ink)]">${listing.amountUsdc} USDC</strong>
              {listing.location ? ` · ${listing.location}` : ""}.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
              Eso supera tu tope de pago automático ({limitLabel} USDC). El
              agente no puede pagarlo solo.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
              Si decís <strong>Sí</strong>, te pedimos confirmar en World App y
              después el agente paga una sola vez. Si decís <strong>No</strong>,
              cancelamos.
            </p>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => void startWorldApproval()}
                className="flex-1 rounded-xl bg-[var(--pine)] px-4 py-3 text-sm font-semibold text-white"
              >
                Sí, aprobar
              </button>
              <button
                type="button"
                onClick={() => {
                  cancelRef.current = true;
                  onClose();
                }}
                className="flex-1 rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-sm font-semibold text-[var(--ink)]"
              >
                No, cancelar
              </button>
            </div>
          </>
        )}

        {phase !== "ask" && (
          <>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--clay)]">
                  Aprobación humana
                </p>
                <h2
                  className="mt-1 text-2xl text-[var(--ink)]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {phase === "done"
                    ? "Listo"
                    : phase === "error"
                      ? "No se pudo aprobar"
                      : "Confirmá en World App"}
                </h2>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  {listing.title} · ${listing.amountUsdc} USDC
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

            <p className="text-sm text-[var(--muted)]">
              {phase === "preparing" && "Preparando verificación…"}
              {phase === "waiting" &&
                (isMobile
                  ? "Abrí World App y confirmá el gasto…"
                  : "Escaneá el QR con World App…")}
              {phase === "submitting" && "World ID OK — emitiendo permiso…"}
              {phase === "purchasing" && "Pagando con el agente…"}
              {phase === "done" && "Reserva pagada con tu aprobación."}
            </p>

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

            {phase === "error" && (
              <button
                type="button"
                onClick={() => {
                  setPhase("ask");
                  setMessage(null);
                }}
                className="mt-4 rounded-xl bg-[var(--pine)] px-4 py-2.5 text-sm font-semibold text-white"
              >
                Volver a intentar
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
