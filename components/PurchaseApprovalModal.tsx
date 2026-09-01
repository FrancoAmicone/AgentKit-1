"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { WorldAppVerifyPanel } from "@/components/WorldAppVerifyPanel";
import {
  isAbortError,
  waitForWorldBridgeProof,
} from "@/lib/world-bridge";
import { formatWorldIdError } from "@/lib/world-id-errors";
import {
  closeReservedWindow,
  isMobileDevice,
  navigateWorldAppWindow,
  reserveWorldAppWindow,
} from "@/lib/world-app-link";

type ListingInfo = {
  id: string;
  title: string;
  /** Total del stay (noches × precio), no el precio por noche. */
  amountUsdc: number;
  location?: string;
  checkIn: string;
  checkOut: string;
  nights: number;
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
  listing: ListingInfo;
  autoPayLimitUsdc?: number;
  onClose: () => void;
  onApprovedPurchase: (result: unknown) => void;
};

/**
 * HITL modal:
 * 1) Sí/No confirm
 * 2) Prepare World Bridge session (async)
 * 3) Mobile: open World App directly (no QR). Desktop: <a> / QR
 * 4) Poll until proof → one-time token → purchase
 *
 * Parent should remount with `key={listing.id}` so local state resets cleanly
 * without setState-in-effect (React 19 lint / best practice).
 */
export function PurchaseApprovalModal({
  open,
  listing,
  autoPayLimitUsdc,
  onClose,
  onApprovedPurchase,
}: Props) {
  const titleId = useId();
  const [phase, setPhase] = useState<Phase>("ask");
  const [message, setMessage] = useState<string | null>(null);
  const [connectorURI, setConnectorURI] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [openedViaReserve, setOpenedViaReserve] = useState(false);
  const startingRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const reservedWinRef = useRef<Window | null>(null);

  const abortInFlight = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  // Abort poll/fetch on unmount or close — no UI setState here.
  useEffect(() => {
    if (!open) {
      abortInFlight();
      startingRef.current = false;
      closeReservedWindow(reservedWinRef.current);
      reservedWinRef.current = null;
    }
    return () => {
      abortInFlight();
      startingRef.current = false;
      closeReservedWindow(reservedWinRef.current);
      reservedWinRef.current = null;
    };
  }, [open, abortInFlight]);

  const close = useCallback(() => {
    abortInFlight();
    closeReservedWindow(reservedWinRef.current);
    reservedWinRef.current = null;
    startingRef.current = false;
    onClose();
  }, [abortInFlight, onClose]);

  const startWorldApproval = useCallback(async () => {
    if (startingRef.current) return;
    abortInFlight();
    startingRef.current = true;
    const ac = new AbortController();
    abortRef.current = ac;

    closeReservedWindow(reservedWinRef.current);
    reservedWinRef.current = isMobileDevice() ? reserveWorldAppWindow() : null;
    setOpenedViaReserve(false);

    setPhase("preparing");
    setMessage(null);
    setConnectorURI(null);
    setQrDataUrl(null);

    try {
      const prepRes = await fetch("/api/agent/approve/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: listing.id,
          checkIn: listing.checkIn,
          checkOut: listing.checkOut,
        }),
        signal: ac.signal,
      });
      const prep = (await prepRes.json()) as PrepareResponse;
      if (!prepRes.ok || !prep.ok) {
        throw new Error(prep.error || "No se pudo preparar la aprobación");
      }

      // Server says under tope again — pay without World (race / limit changed).
      if (!prep.approvalNeeded) {
        closeReservedWindow(reservedWinRef.current);
        reservedWinRef.current = null;
        setPhase("purchasing");
        const buyRes = await fetch("/api/agent/purchase", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            listingId: listing.id,
            checkIn: listing.checkIn,
            checkOut: listing.checkOut,
          }),
          signal: ac.signal,
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

      setPhase("waiting");
      setMessage(
        isMobileDevice()
          ? "Abrimos World App en este teléfono. Si no la tenés, usá el link de la tienda."
          : "Escaneá el QR con World App. Esta ventana se queda esperando.",
      );

      const proof = await waitForWorldBridgeProof(
        {
          appId: prep.appId,
          action: prep.action,
          signalTypes: prep.signal.types,
          signalValues: prep.signal.values,
          actionDescription:
            prep.actionDescription ||
            `Aprobar pago StayAgent $${listing.amountUsdc} USDC`,
        },
        {
          signal: ac.signal,
          onReady: ({ connectorURI: uri, qrDataUrl: qr }) => {
            const reserved = reservedWinRef.current;
            reservedWinRef.current = null;
            let opened = false;
            if (isMobileDevice()) {
              opened = navigateWorldAppWindow(reserved, uri);
            } else {
              closeReservedWindow(reserved);
            }
            setOpenedViaReserve(opened);
            setConnectorURI(uri);
            setQrDataUrl(qr);
          },
        },
      );

      setPhase("submitting");
      setMessage("World App confirmó — pagando la reserva…");

      const completeRes = await fetch("/api/agent/approve/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: prep.sessionId, proof }),
        signal: ac.signal,
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
          checkIn: listing.checkIn,
          checkOut: listing.checkOut,
          approvalToken: complete.approvalToken,
        }),
        signal: ac.signal,
      });
      const buy = await buyRes.json();
      if (!buyRes.ok || !buy.ok) {
        throw new Error(buy.error || "El pago falló después de la aprobación");
      }
      setPhase("done");
      setMessage("Reserva pagada con tu aprobación.");
      onApprovedPurchase(buy);
    } catch (err) {
      closeReservedWindow(reservedWinRef.current);
      reservedWinRef.current = null;
      if (isAbortError(err) || ac.signal.aborted) return;
      setPhase("error");
      setMessage(formatWorldIdError(err));
    } finally {
      if (abortRef.current === ac) {
        abortRef.current = null;
      }
      startingRef.current = false;
    }
  }, [listing, onApprovedPurchase, abortInFlight]);

  const limitLabel =
    autoPayLimitUsdc != null ? `$${autoPayLimitUsdc}` : "tu tope";

  return (
    <Modal open={open} onClose={close} labelledBy={titleId} size="md">
      <div className="p-5 sm:p-6">
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
              por {listing.nights} noche{listing.nights === 1 ? "" : "s"} (
              {listing.checkIn} → {listing.checkOut}) cuesta{" "}
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
                className="flex-1 rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-3 text-sm font-semibold text-[var(--ink)]"
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
                  {listing.title} · {listing.nights} noche
                  {listing.nights === 1 ? "" : "s"} · ${listing.amountUsdc} USDC
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                className="shrink-0 rounded-lg px-2 py-1 text-sm font-semibold text-[var(--muted)] hover:bg-white/5"
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
                  {isMobileDevice()
                    ? "Quedate en esta pantalla. World App debería abrirse sola; si no, usá los botones de abajo."
                    : "Escaneá el QR con World App. StayAgent espera acá."}
                </p>
                {connectorURI && (
                  <WorldAppVerifyPanel
                    deepLink={connectorURI}
                    qrDataUrl={qrDataUrl}
                    autoOpen={!openedViaReserve}
                  />
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
              <p className="text-sm font-medium text-[var(--pine)]">
                Reserva pagada con tu aprobación.
              </p>
            )}

            {message && phase !== "done" && (
              <p
                className={`mt-3 text-sm ${
                  phase === "error"
                    ? "text-[var(--danger)]"
                    : "text-[var(--muted)]"
                }`}
              >
                {message}
              </p>
            )}

            {phase === "error" && (
              <button
                type="button"
                onClick={() => {
                  abortInFlight();
                  startingRef.current = false;
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
    </Modal>
  );
}
