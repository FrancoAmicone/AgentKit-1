"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createWorldBridgeStore } from "@worldcoin/idkit-core";
import { solidityEncode } from "@worldcoin/idkit-core/hashing";
import QRCode from "qrcode";
import { isMobileDevice } from "@/lib/world-app-link";

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
  const [isMobile, setIsMobile] = useState(false);
  const cancelRef = useRef(false);
  const startingRef = useRef(false);

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  const reset = useCallback(() => {
    cancelRef.current = true;
    startingRef.current = false;
    setPhase("idle");
    setMessage(null);
    setConnectorURI(null);
    setQrDataUrl(null);
  }, []);

  const startRegistration = useCallback(async () => {
    if (startingRef.current) return;
    startingRef.current = true;
    cancelRef.current = false;
    setPhase("preparing");
    setMessage(null);
    setConnectorURI(null);
    setQrDataUrl(null);

    try {
      const prepRes = await fetch("/api/agent/register/prepare");
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
          prep.actionDescription || "Register StayAgent in AgentBook",
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
      // No auto-open after async — user taps the <a> once (fresh gesture).

      const deadline = Date.now() + 300_000;
      while (Date.now() < deadline) {
        if (cancelRef.current) return;
        try {
          await worldID.getState().pollForUpdates();
        } catch {
          await new Promise((r) => setTimeout(r, 1500));
          continue;
        }
        const { result, errorCode } = worldID.getState();
        if (errorCode) {
          throw new Error(
            errorCode === "connection_failed"
              ? "Se cortó la conexión con World Bridge. Reintentá y abrí World App una sola vez."
              : `World ID: ${errorCode}`,
          );
        }
        if (result) {
          setPhase("submitting");
          setMessage("World ID OK — registrando en AgentBook…");

          const completeRes = await fetch("/api/agent/register/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nonce: prep.nonce, proof: result }),
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
          return;
        }
        await new Promise((r) => setTimeout(r, 1200));
      }
      throw new Error("Se agotó el tiempo esperando World App. Reintentá.");
    } catch (err) {
      if (cancelRef.current) return;
      setPhase("error");
      const raw = err instanceof Error ? err.message : "Error de registro";
      const friendly =
        raw === "Load failed" || /failed to fetch|networkerror/i.test(raw)
          ? "Falló la conexión con World. Reintentá y abrí World App una sola vez (o escaneá el QR)."
          : raw;
      setMessage(friendly);
    } finally {
      startingRef.current = false;
    }
  }, [onRegistered]);

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
          disabled={
            phase === "preparing" ||
            phase === "waiting" ||
            phase === "submitting"
          }
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
        <a
          href={connectorURI}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex rounded-xl bg-[var(--pine)] px-4 py-2 text-sm font-semibold text-white"
        >
          Abrir World App
        </a>
      )}

      {phase === "waiting" && qrDataUrl && (
        <div className="mt-4 flex flex-col items-start gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrDataUrl}
            alt="QR para verificar en World App"
            className="rounded-lg border border-[var(--line)] bg-white p-2"
            width={220}
            height={220}
          />
          <p className="text-xs text-[var(--muted)]">
            {isMobile
              ? "Si el link abre la tienda: World App → escanear este QR."
              : "World App → escanear QR → confirmar."}
          </p>
        </div>
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
