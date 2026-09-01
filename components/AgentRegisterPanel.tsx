"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
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

type PrepareResponse = {
  ok: boolean;
  alreadyRegistered?: boolean;
  agentAddress?: string;
  nonce?: string;
  appId?: `app_${string}`;
  action?: string;
  signal?: { types: string[]; values: [string, string] };
  actionDescription?: string;
  humanId?: string | null;
  error?: string;
};

type CompleteResponse = {
  ok: boolean;
  registered?: boolean;
  alreadyRegistered?: boolean;
  txHash?: string;
  humanId?: string | null;
  error?: string;
};

type Phase =
  | "idle"
  | "preparing"
  | "waiting"
  | "submitting"
  | "done"
  | "error";

export function AgentRegisterPanel({
  onRegistered,
  prepareUrl = "/api/agent/register/prepare",
  completeUrl = "/api/agent/register/complete",
  intro,
  actionDescriptionFallback = "Register StayAgent in AgentBook",
  doneLabel = "Registrado ✓",
  idleLabel = "Registrar con World App",
}: {
  onRegistered: () => void;
  prepareUrl?: string;
  completeUrl?: string;
  /** Optional copy override (e.g. host wallet verify). Default adapts to mobile. */
  intro?: ReactNode;
  actionDescriptionFallback?: string;
  doneLabel?: string;
  idleLabel?: string;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
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

  useEffect(() => {
    return () => {
      abortInFlight();
      closeReservedWindow(reservedWinRef.current);
      reservedWinRef.current = null;
    };
  }, [abortInFlight]);

  const reset = useCallback(() => {
    abortInFlight();
    closeReservedWindow(reservedWinRef.current);
    reservedWinRef.current = null;
    startingRef.current = false;
    setPhase("idle");
    setMessage(null);
    setConnectorURI(null);
    setQrDataUrl(null);
    setOpenedViaReserve(false);
  }, [abortInFlight]);

  const startRegistration = useCallback(async () => {
    if (startingRef.current) return;
    startingRef.current = true;
    abortInFlight();
    const ac = new AbortController();
    abortRef.current = ac;

    // Reserve a window in the tap gesture so mobile can open World without a
    // second click (post-await window.open is often blocked).
    closeReservedWindow(reservedWinRef.current);
    reservedWinRef.current = isMobileDevice() ? reserveWorldAppWindow() : null;
    setOpenedViaReserve(false);

    setPhase("preparing");
    setMessage(null);
    setConnectorURI(null);
    setQrDataUrl(null);

    try {
      const prepRes = await fetch(prepareUrl, {
        signal: ac.signal,
      });
      const prep = (await prepRes.json()) as PrepareResponse;
      if (!prepRes.ok || !prep.ok) {
        throw new Error(prep.error || "No se pudo preparar el registro");
      }

      if (prep.alreadyRegistered) {
        closeReservedWindow(reservedWinRef.current);
        reservedWinRef.current = null;
        setPhase("done");
        setMessage("Ya está registrado en AgentBook.");
        onRegistered();
        return;
      }

      if (!prep.appId || !prep.action || !prep.signal || !prep.nonce) {
        throw new Error("Respuesta de prepare incompleta");
      }

      setPhase("waiting");

      const proof = await waitForWorldBridgeProof(
        {
          appId: prep.appId,
          action: prep.action,
          signalTypes: prep.signal.types,
          signalValues: prep.signal.values,
          actionDescription:
            prep.actionDescription || actionDescriptionFallback,
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
      setMessage("World ID OK — registrando en AgentBook…");

      const completeRes = await fetch(completeUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nonce: prep.nonce, proof }),
        signal: ac.signal,
      });
      const complete = (await completeRes.json()) as CompleteResponse;
      if (!completeRes.ok || !complete.ok) {
        throw new Error(complete.error || "Falló el registro onchain");
      }

      setPhase("done");
      setMessage(
        complete.txHash
          ? `Registrado en AgentBook. Tx: ${complete.txHash}`
          : "Registrado en AgentBook.",
      );
      onRegistered();
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
  }, [
    onRegistered,
    abortInFlight,
    prepareUrl,
    completeUrl,
    actionDescriptionFallback,
  ]);

  const busy =
    phase === "preparing" || phase === "waiting" || phase === "submitting";
  const mobile = isMobileDevice();

  return (
    <div className="space-y-4 text-sm text-[var(--ink)]">
      <p className="leading-relaxed text-[var(--muted)]">
        {intro ??
          (mobile ? (
            <>
              Preparamos la verificación y abrimos{" "}
              <strong className="text-[var(--ink)]">World App</strong> en este
              teléfono. Si no la tenés, te mandamos a la tienda.
            </>
          ) : (
            <>
              Preparamos la verificación; después abrís World App{" "}
              <strong className="text-[var(--ink)]">una sola vez</strong> o
              escaneás el QR.
            </>
          ))}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => void startRegistration()}
          disabled={busy}
          className="bg-[var(--pine)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {phase === "preparing"
            ? "Preparando…"
            : phase === "waiting"
              ? "Esperando World App…"
              : phase === "submitting"
                ? "Registrando…"
                : phase === "done"
                  ? doneLabel
                  : idleLabel}
        </button>

        {(phase === "waiting" || phase === "error") && (
          <button
            type="button"
            onClick={reset}
            className="text-sm font-semibold text-[var(--pine)] underline"
          >
            Cancelar
          </button>
        )}

        <button
          type="button"
          onClick={onRegistered}
          className="text-sm font-semibold text-[var(--muted)] underline"
        >
          Ya lo registré — refrescar
        </button>
      </div>

      {phase === "waiting" && connectorURI && (
        <WorldAppVerifyPanel
          deepLink={connectorURI}
          qrDataUrl={qrDataUrl}
          autoOpen={!openedViaReserve}
        />
      )}

      {message && (
        <p
          className={`text-xs ${
            phase === "error" ? "text-[var(--danger)]" : "text-[var(--muted)]"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
