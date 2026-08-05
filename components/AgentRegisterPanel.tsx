"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createWorldBridgeStore } from "@worldcoin/idkit-core";
import { solidityEncode } from "@worldcoin/idkit-core/hashing";
import QRCode from "qrcode";
import { isMobileDevice, openWorldAppLink } from "@/lib/world-app-link";

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

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  const reset = useCallback(() => {
    cancelRef.current = true;
    setPhase("idle");
    setMessage(null);
    setConnectorURI(null);
    setQrDataUrl(null);
  }, []);

  const startRegistration = useCallback(async () => {
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

      setConnectorURI(uri);
      setPhase("waiting");

      const mobile = isMobileDevice();
      setIsMobile(mobile);

      // Keep SPA alive to poll; never navigate away with location.href.
      const dataUrl = await QRCode.toDataURL(uri, {
        width: 220,
        margin: 2,
        color: { dark: "#1a2e24", light: "#ffffff" },
      });
      if (cancelRef.current) return;
      setQrDataUrl(dataUrl);
      if (mobile) {
        openWorldAppLink(uri);
      }

      const deadline = Date.now() + 300_000;
      while (Date.now() < deadline) {
        if (cancelRef.current) return;
        await worldID.getState().pollForUpdates();
        const { result, errorCode } = worldID.getState();
        if (errorCode) {
          throw new Error(`World ID: ${errorCode}`);
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
        await new Promise((r) => setTimeout(r, 1000));
      }
      throw new Error("Se agotó el tiempo esperando World App. Reintentá.");
    } catch (err) {
      if (cancelRef.current) return;
      setPhase("error");
      const raw = err instanceof Error ? err.message : "Error de registro";
      const friendly =
        raw === "Load failed" || /failed to fetch|networkerror/i.test(raw)
          ? "No se pudo conectar con World (Load failed). Usá “Abrir World App” o el QR desde la app instalada."
          : raw;
      setMessage(friendly);
    }
  }, [onRegistered]);

  return (
    <div className="mt-3 rounded-xl bg-[var(--sand)]/60 px-3 py-3 text-sm text-[var(--ink)]">
      <p className="font-medium">Falta registrar el agente en AgentBook</p>
      <p className="mt-1 text-[var(--muted)]">
        Usá World App: en el teléfono se abre la app; en escritorio escaneá el
        QR. Se registra la wallet del agente de StayAgent (la que paga).
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => void startRegistration()}
          disabled={phase === "preparing" || phase === "waiting" || phase === "submitting"}
          className="rounded-xl bg-[var(--pine)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {phase === "preparing"
            ? "Preparando…"
            : phase === "waiting"
              ? isMobile
                ? "Esperando World App…"
                : "Escaneá el QR…"
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
        <button
          type="button"
          onClick={() => openWorldAppLink(connectorURI)}
          className="mt-3 rounded-xl bg-[var(--pine)] px-4 py-2 text-sm font-semibold text-white"
        >
          Abrir World App
        </button>
      )}

      {phase === "waiting" && qrDataUrl && (
        <div className="mt-4 flex flex-col items-start gap-2">
          <img
            src={qrDataUrl}
            alt="QR para verificar en World App"
            className="rounded-lg border border-[var(--line)] bg-white p-2"
            width={220}
            height={220}
          />
          <p className="text-xs text-[var(--muted)]">
            {isMobile
              ? "Si el link te manda a la tienda: abrí World App → escanear este QR."
              : "Abrí World App → escanear QR → confirmar."}
          </p>
        </div>
      )}

      {message && (
        <p
          className={`mt-3 text-xs ${
            phase === "error" ? "text-red-700" : "text-[var(--muted)]"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
