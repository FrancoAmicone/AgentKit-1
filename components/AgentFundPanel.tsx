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
};

export function AgentFundPanel({
  address,
  balances,
  fundHint,
  onRefresh,
  refreshing,
}: Props) {
  const [qr, setQr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void QRCode.toDataURL(address, {
      width: 180,
      margin: 2,
      color: { dark: "#1a2e24", light: "#ffffff" },
    }).then((url) => {
      if (!cancelled) setQr(url);
    });
    return () => {
      cancelled = true;
    };
  }, [address]);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }, [address]);

  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--sand)]/50 p-3">
      <p className="text-sm font-semibold text-[var(--ink)]">Cargar fondos</p>
      <p className="mt-1 text-xs text-[var(--muted)]">
        Enviá{" "}
        <strong>
          {fundHint?.asset || "USDC"} en {fundHint?.network || "Base Sepolia"}
        </strong>{" "}
        a la wallet de tu agente. Podés usar MetaMask u otra wallet — solo para
        fondear, no para firmar pagos.
      </p>

      <div className="mt-3 break-all rounded-lg border border-[var(--line)] bg-white px-3 py-2 font-mono text-xs text-[var(--ink)]">
        {address}
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void copy()}
          className="rounded-xl bg-[var(--pine)] px-3 py-1.5 text-xs font-semibold text-white"
        >
          {copied ? "Copiado ✓" : "Copiar address"}
        </button>
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="rounded-xl border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--ink)] disabled:opacity-60"
        >
          {refreshing ? "Actualizando…" : "Actualizar saldo"}
        </button>
        {fundHint?.explorer && (
          <a
            href={fundHint.explorer}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl px-3 py-1.5 text-xs font-semibold text-[var(--pine)] underline"
          >
            Ver en Basescan
          </a>
        )}
      </div>

      {qr && (
        <div className="mt-3 flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt="QR address del agente" width={180} height={180} />
        </div>
      )}

      <p className="mt-3 text-sm text-[var(--ink)]">
        Saldo:{" "}
        <strong>
          {balances != null ? `$${balances.usdc.toFixed(4)} USDC` : "…"}
        </strong>
        {balances != null && (
          <span className="text-[var(--muted)]">
            {" "}
            · {balances.eth.toFixed(5)} ETH
          </span>
        )}
      </p>

      {balances?.funded ? (
        <p className="mt-1 text-xs font-medium text-[var(--pine-deep)]">
          Fondos OK (≥ ${balances.minUsdcToFund} USDC)
        </p>
      ) : (
        <p className="mt-1 text-xs text-[var(--clay)]">
          Necesitás al menos ${balances?.minUsdcToFund ?? 0.05} USDC para
          reservar demos.
        </p>
      )}

      <div className="mt-2 flex flex-wrap gap-3 text-xs">
        {fundHint?.faucetUsdc && (
          <a
            href={fundHint.faucetUsdc}
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-[var(--pine)] underline"
          >
            Faucet USDC (CDP Portal)
          </a>
        )}
        {fundHint?.faucetEth && (
          <a
            href={fundHint.faucetEth}
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-[var(--pine)] underline"
          >
            Faucet ETH Base Sepolia
          </a>
        )}
      </div>
    </div>
  );
}
