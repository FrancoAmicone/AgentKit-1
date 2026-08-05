"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { WorldAppVerifyPanel } from "@/components/WorldAppVerifyPanel";
import {
  isAbortError,
  waitForWorldBridgeProof,
} from "@/lib/world-bridge";
import { formatWorldIdError } from "@/lib/world-id-errors";

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
}: {
  onRegistered: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [connectorURI, setConnectorURI] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const startingRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  const abortInFlight = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  useEffect(() => () => abortInFlight(), [abortInFlight]);

  const reset = useCallback(() => {
    abortInFlight();
    startingRef.current = false;
    setPhase("idle");
    setMessage(null);
    setConnectorURI(null);
    setQrDataUrl(null);
  }, [abortInFlight]);

  const startRegistration = useCallback(async () => {
    if (startingRef.current) return;
    startingRef.current = true;
    abortInFlight();
    const ac = new AbortController();
    abortRef.current = ac;

    setPhase("preparing");
    setMessage(null);
    setConnectorURI(null);
    setQrDataUrl(null);

    try {
      const prepRes = await fetch("/api/agent/register/prepare", {
        signal: ac.signal,
      });
      const prep = (await prepRes.json()) as PrepareResponse;
      if (!prepRes.ok || !prep.ok) {
        throw new Error(prep.error || "No se pudo preparar el registro");
      }

      if (prep.alreadyRegistered) {
        setPhase("done");
        setMessage("El agente ya está registrado en AgentBook.");
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
            prep.actionDescription || "Register StayAgent in AgentBook",
        },
        {
          signal: ac.signal,
          onReady: ({ connectorURI: uri, qrDataUrl: qr }) => {
            setConnectorURI(uri);
            setQrDataUrl(qr);
          },
        },
      );

      setPhase("submitting");
      setMessage("World ID OK — registrando en AgentBook…");

      const completeRes = await fetch("/api/agent/register/complete", {
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
          ? `Agente registrado. Tx: ${complete.txHash}`
          : "Agente registrado en AgentBook.",
      );
      onRegistered();
    } catch (err) {
      if (isAbortError(err) || ac.signal.aborted) return;
      setPhase("error");
      setMessage(formatWorldIdError(err));
    } finally {
      if (abortRef.current === ac) {
        abortRef.current = null;
      }
      startingRef.current = false;
    }
  }, [onRegistered, abortInFlight]);

  const busy =
    phase === "preparing" || phase === "waiting" || phase === "submitting";

  return (
    <div className="mt-3 rounded-xl bg-[var(--sand)]/60 px-3 py-3 text-sm text-[var(--ink)]">
      <p className="font-medium">Falta registrar el agente en AgentBook</p>
      <p className="mt-1 text-[var(--muted)]">
        Primero preparamos la verificación; después abrís World App{" "}
        <strong>una sola vez</strong> o escaneás el QR.
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => void startRegistration()}
          disabled={busy}
          className="rounded-xl bg-[var(--pine)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {phase === "preparing"
            ? "Preparando…"
            : phase === "waiting"
              ? "Esperando World App…"
              : phase === "submitting"
                ? "Registrando…"
                : phase === "done"
                  ? "Registrado ✓"
                  : "Registrar con World App"}
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
        <WorldAppVerifyPanel deepLink={connectorURI} qrDataUrl={qrDataUrl} />
      )}

      {message && (
        <p
          className={`mt-3 text-xs ${
            phase === "error" ? "text-[var(--danger)]" : "text-[var(--muted)]"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
