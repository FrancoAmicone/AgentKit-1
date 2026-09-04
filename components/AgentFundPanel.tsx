"use client";

import { useCallback, useEffect, useState } from "react";
import QRCode from "qrcode";

type Balances = {
  usdc: number;
  eth: number;
  funded: boolean;
  minUsdcToFund: number;
};

type FundHint = {
  network: string;
  asset: string;
  faucetEth?: string;
  faucetUsdc?: string;
  explorer?: string;
};

type Props = {
  address: string;
  balances: Balances | null;
  fundHint?: FundHint | null;
  onRefresh: () => void;
  refreshing?: boolean;
  compact?: boolean;
};

/**
 * Didactic funding step: copy wallet first, then faucet/send, then refresh.
 */
export function AgentFundPanel({
  address,
  balances,
  fundHint,
  onRefresh,
  refreshing,
  compact = false,
}: Props) {
  const [qr, setQr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const funded = Boolean(balances?.funded);
  const hideTutorial = compact && funded;

  useEffect(() => {
    if (hideTutorial) return;
    let cancelled = false;
    void QRCode.toDataURL(address, {
      width: compact ? 120 : 168,
      margin: 1,
      color: { dark: "#0a101a", light: "#e8eef7" },
    }).then((url) => {
      if (!cancelled) setQr(url);
    });
    return () => {
      cancelled = true;
    };
  }, [address, compact, hideTutorial]);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      // ignore — user can still select the address
    }
  }, [address]);

  const min = balances?.minUsdcToFund ?? 0.05;
  const network = fundHint?.network || "Base Sepolia";
  const asset = fundHint?.asset || "USDC";

  return (
    <div className={compact ? "space-y-3" : "space-y-5"}>
      {!hideTutorial && (
      <ol className={`space-y-3 leading-relaxed text-[var(--muted)] ${compact ? "text-xs" : "text-sm"}`}>
        <li className="flex gap-3">
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center bg-[var(--pine)] text-xs font-bold text-[var(--paper)]">
            1
          </span>
          <span>
            <strong className="text-[var(--ink)]">Copiá la wallet del agente</strong>{" "}
            (abajo). Es la dirección que recibe fondos — no la tuya personal.
          </span>
        </li>
        <li className="flex gap-3">
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center bg-[var(--pine)] text-xs font-bold text-[var(--paper)]">
            2
          </span>
          <span>
            Pegala en un faucet o en tu wallet y enviá{" "}
            <strong className="text-[var(--ink)]">
              {asset} en {network}
            </strong>{" "}
            (testnet, sin valor real). Ideal ~${min}+ USDC.
          </span>
        </li>
        <li className="flex gap-3">
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center bg-[var(--pine)] text-xs font-bold text-[var(--paper)]">
            3
          </span>
          <span>
            Volvé acá y tocá{" "}
            <strong className="text-[var(--ink)]">Actualizar saldo</strong>.
            Cuando haya fondos, pasamos a World.
          </span>
        </li>
      </ol>
      )}

      <div className="border border-[var(--line)] bg-[var(--surface-strong)] p-3">
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
          Wallet del agente
        </p>
        <button
          type="button"
          onClick={() => void copy()}
          className="w-full break-all text-left font-mono text-xs leading-relaxed text-[var(--ink)]"
          title="Tocar para copiar"
        >
          {address}
        </button>
      </div>

      <button
        type="button"
        onClick={() => void copy()}
        className={`w-full bg-[var(--pine)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--pine-deep)] ${
          compact ? "py-2.5" : "py-3.5"
        }`}
      >
        {copied
          ? hideTutorial
            ? "✓ Copiada"
            : "✓ Copiada — ahora pegala en el faucet"
          : hideTutorial
            ? "Copiar wallet"
            : "Copiar wallet del agente"}
      </button>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="border border-[var(--line)] bg-[var(--surface-strong)] px-3 py-2 text-xs font-semibold text-[var(--ink)] disabled:opacity-60"
        >
          {refreshing ? "Actualizando…" : "Actualizar saldo"}
        </button>
        {fundHint?.faucetUsdc && !hideTutorial && (
          <a
            href={fundHint.faucetUsdc}
            target="_blank"
            rel="noreferrer"
            className="border border-[var(--pine)]/40 px-3 py-2 text-xs font-semibold text-[var(--pine)]"
          >
            Abrir faucet USDC
          </a>
        )}
        {fundHint?.faucetEth && !hideTutorial && (
          <a
            href={fundHint.faucetEth}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-2 text-xs font-semibold text-[var(--muted)] underline"
          >
            Faucet ETH (gas)
          </a>
        )}
        {fundHint?.explorer && (
          <a
            href={fundHint.explorer}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-2 text-xs font-semibold text-[var(--muted)] underline"
          >
            Ver en Basescan
          </a>
        )}
      </div>

      {!hideTutorial && (
      <div className={`flex items-start gap-3 ${compact ? "flex-row" : "flex-col sm:flex-row sm:items-center sm:gap-4"}`}>
        {qr && !hideTutorial && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={qr}
            alt="QR de la wallet del agente"
            width={compact ? 96 : 140}
            height={compact ? 96 : 140}
            className="shrink-0 border border-[var(--line)] bg-[var(--surface-strong)] p-1.5"
          />
        )}
        <div>
          <p className="text-sm text-[var(--ink)]">
            Saldo{" "}
            <strong>
              {balances != null ? `$${balances.usdc.toFixed(4)}` : "…"} USDC
            </strong>
            {balances != null && (
              <span className="text-[var(--muted)]">
                {" "}
                · {balances.eth.toFixed(5)} ETH
              </span>
            )}
          </p>
          {balances?.funded ? (
            <p className="mt-1 text-xs font-medium text-[var(--pine)]">
              Fondos OK — siguiente paso: verificar con World
            </p>
          ) : (
            <p className="mt-1 text-xs text-[var(--clay)]">
              Todavía sin fondos suficientes (mín. ~${min} USDC para demos)
            </p>
          )}
          <p className="mt-2 text-[11px] leading-relaxed text-[var(--muted)]">
            Tip: en desktop también podés escanear el QR desde el teléfono con
            tu wallet.
          </p>
        </div>
      </div>
      )}
    </div>
  );
}
