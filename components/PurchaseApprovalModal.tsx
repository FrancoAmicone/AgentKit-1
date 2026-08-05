"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { createWorldBridgeStore } from "@worldcoin/idkit-core";
import { solidityEncode } from "@worldcoin/idkit-core/hashing";
import QRCode from "qrcode";
import { isMobileDevice } from "@/lib/world-app-link";

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

type Props = {
  open: boolean;
  listing: ListingInfo | null;
  autoPayLimitUsdc?: number;
  onClose: () => void;
  onApprovedPurchase: (result: unknown) => void;
};

/**
 * HITL modal:
 * 1) Sí/No confirm
 * 2) Prepare World Bridge session (async)
 * 3) User taps a single <a> to open World App (fresh gesture) OR scans QR
 * 4) Poll until proof → purchase with one-time token
 */
export function PurchaseApprovalModal({
  open,
  listing,
  autoPayLimitUsdc,
  onClose,
  onApprovedPurchase,
}: Props) {
  const titleId = useId();
  const [mounted, setMounted] = useState(false);
  const [phase, setPhase] = useState<Phase>("ask");
  const [message, setMessage] = useState<string | null>(null);
  const [connectorURI, setConnectorURI] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const cancelRef = useRef(false);
  const startingRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      cancelRef.current = true;
      startingRef.current = false;
      setPhase("ask");
      setMessage(null);
      setConnectorURI(null);
      setQrDataUrl(null);
      return;
    }
    cancelRef.current = false;
    startingRef.current = false;
    setPhase("ask");
    setMessage(null);
    setConnectorURI(null);
    setQrDataUrl(null);
    setIsMobile(isMobileDevice());
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, listing?.id]);

  const close = useCallback(() => {
    cancelRef.current = true;
    startingRef.current = false;
    onClose();
  }, [onClose]);

  const startWorldApproval = useCallback(async () => {
    if (!listing || startingRef.current) return;
    startingRef.current = true;
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
          throw new Error(buy.error || "No se pudo completar el pago");
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

      const dataUrl = await QRCode.toDataURL(uri, {
        width: 220,
        margin: 2,
        color: { dark: "#1a2e24", light: "#ffffff" },
      });
      if (cancelRef.current) return;

      setConnectorURI(uri);
      setQrDataUrl(dataUrl);
      setIsMobile(isMobileDevice());
      setPhase("waiting");
      setMessage(
        isMobileDevice()
          ? "Tocá una sola vez “Abrir World App”, o escaneá el QR desde la app."
          : "Escaneá el QR con World App. Esta ventana se queda esperando.",
      );

      // Do NOT auto-open World App here — async lost the user gesture and
      // Chrome blocks / spams popups. User must tap the <a> below once.

      const deadline = Date.now() + 300_000;
      while (Date.now() < deadline) {
        if (cancelRef.current) return;
        try {
          await worldID.getState().pollForUpdates();
        } catch {
          // Transient network blip — keep waiting
          await new Promise((r) => setTimeout(r, 1500));
          continue;
        }
        const { result, errorCode } = worldID.getState();
        if (errorCode) {
          // Bridge marks the session failed; user must restart (new action/nonce).
          throw new Error(
            errorCode === "connection_failed"
              ? "Se cortó la conexión con World Bridge. Volvé a intentar y abrí World App una sola vez."
              : `World ID: ${errorCode}`,
          );
        }
        if (result) {
          setPhase("submitting");
          setMessage("World App confirmó — pagando la reserva…");

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
            throw new Error(buy.error || "El pago falló después de la aprobación");
          }
          setPhase("done");
          setMessage("Reserva pagada con tu aprobación.");
          onApprovedPurchase(buy);
          return;
        }
        await new Promise((r) => setTimeout(r, 1200));
      }
      throw new Error("Se agotó el tiempo esperando World App. Reintentá.");
    } catch (err) {
      if (cancelRef.current) return;
      setPhase("error");
      const raw = err instanceof Error ? err.message : "Error de aprobación";
      const friendly =
        raw === "Load failed" || /failed to fetch|networkerror/i.test(raw)
          ? "Falló la conexión con World. Cerrá pestañas extra, tocá “Volver a intentar” y abrí World App una sola vez (o escaneá el QR)."
          : raw;
      setMessage(friendly);
    } finally {
      startingRef.current = false;
    }
  }, [listing, onApprovedPurchase]);

  if (!mounted || !open || !listing) return null;

  const limitLabel =
    autoPayLimitUsdc != null ? `$${autoPayLimitUsdc}` : "tu tope";

  const modal = (
    <div
      className="fixed inset-0 flex items-end justify-center sm:items-center sm:p-4"
      style={{ zIndex: 10000 }}
      role="presentation"
    >
      {/* Opaque scrim — blocks listing images bleeding through */}
      <button
        type="button"
        aria-label="Cerrar"
        className="absolute inset-0 bg-[rgba(26,36,33,0.72)]"
        onClick={close}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative isolate flex max-h-[min(92vh,720px)] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-[var(--line)] bg-[var(--paper)] shadow-[0_24px_80px_rgba(26,36,33,0.45)] sm:rounded-2xl"
        style={{ zIndex: 10001 }}
      >
        <div className="overflow-y-auto p-5 sm:p-6">
          {phase === "ask" && (
            <>
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--clay)]">
                Tope automático
              </p>
              <h2
                id={titleId}
                className="mt-1 text-2xl text-[var(--ink)]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                ¿Aprobás este gasto?
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
                <strong className="text-[var(--ink)]">{listing.title}</strong>{" "}
                cuesta{" "}
                <strong className="text-[var(--ink)]">
                  ${listing.amountUsdc} USDC
                </strong>
                {listing.location ? ` · ${listing.location}` : ""}.
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                Supera tu tope de pago automático ({limitLabel} USDC). El agente
                no puede pagarlo solo.
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                <strong>Sí</strong> → preparar verificación World App (después
                abrís la app una sola vez). <strong>No</strong> → cancelar.
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
                  onClick={close}
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
                    id={titleId}
                    className="mt-1 text-2xl text-[var(--ink)]"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {phase === "done"
                      ? "Listo"
                      : phase === "error"
                        ? "No se pudo completar"
                        : phase === "preparing"
                          ? "Preparando…"
                          : "Confirmá en World App"}
                  </h2>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    {listing.title} · ${listing.amountUsdc} USDC
                  </p>
                </div>
                <button
                  type="button"
                  onClick={close}
                  className="shrink-0 rounded-lg px-2 py-1 text-sm font-semibold text-[var(--muted)] hover:bg-black/5"
                >
                  Cerrar
                </button>
              </div>

              {phase === "preparing" && (
                <p className="text-sm text-[var(--muted)]">
                  Creando la solicitud de verificación… no abras nada todavía.
                </p>
              )}

              {phase === "waiting" && (
                <>
                  <p className="text-sm text-[var(--muted)]">
                    {isMobile
                      ? "Quedate en esta pantalla. Abrí World App una sola vez con el botón, o escaneá el QR desde la app instalada."
                      : "Escaneá el QR con World App. StayAgent espera acá."}
                  </p>

                  {/* Real anchor = one browser open, tied to user click */}
                  {connectorURI && (
                    <a
                      href={connectorURI}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 flex w-full items-center justify-center rounded-xl bg-[var(--pine)] px-4 py-3 text-center text-sm font-semibold text-white"
                    >
                      Abrir World App
                    </a>
                  )}

                  {qrDataUrl && (
                    <div className="mt-4 rounded-xl border border-[var(--line)] bg-white p-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={qrDataUrl}
                        alt="QR World App"
                        className="mx-auto block"
                        width={220}
                        height={220}
                      />
                      <p className="mt-2 text-center text-xs text-[var(--muted)]">
                        Si el link abre la tienda: abrí World App → escanear QR.
                      </p>
                    </div>
                  )}
                </>
              )}

              {(phase === "submitting" || phase === "purchasing") && (
                <p className="text-sm text-[var(--muted)]">
                  {phase === "submitting"
                    ? "World App confirmó — emitiendo permiso de pago…"
                    : "Pagando la reserva con el agente…"}
                </p>
              )}

              {phase === "done" && (
                <p className="text-sm font-medium text-[var(--pine-deep)]">
                  Reserva pagada con tu aprobación.
                </p>
              )}

              {message && phase !== "done" && (
                <p
                  className={`mt-3 text-sm ${
                    phase === "error" ? "text-[var(--danger)]" : "text-[var(--muted)]"
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
                    setConnectorURI(null);
                    setQrDataUrl(null);
                  }}
                  className="mt-4 w-full rounded-xl bg-[var(--pine)] px-4 py-2.5 text-sm font-semibold text-white"
                >
                  Volver a intentar
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
