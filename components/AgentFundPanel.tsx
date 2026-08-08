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
      width: 168,
      margin: 1,
      color: { dark: "#1a2421", light: "#ffffff" },
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
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-[var(--muted)]">
        Enviá{" "}
        <strong className="text-[var(--ink)]">
          {fundHint?.asset || "USDC"} · {fundHint?.network || "Base Sepolia"}
        </strong>{" "}
        desde MetaMask u otra wallet. Solo fondeo — el agente firma después.
      </p>

      <div className="break-all border border-[var(--line)] bg-white/80 px-3 py-3 font-mono text-xs text-[var(--ink)]">
        {address}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void copy()}
          className="bg-[var(--pine)] px-3 py-2 text-xs font-semibold text-white"
        >
          {copied ? "Copiado ✓" : "Copiar address"}
        </button>
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="border border-[var(--line)] bg-white px-3 py-2 text-xs font-semibold text-[var(--ink)] disabled:opacity-60"
        >
          {refreshing ? "Actualizando…" : "Actualizar saldo"}
        </button>
        {fundHint?.explorer && (
          <a
            href={fundHint.explorer}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-2 text-xs font-semibold text-[var(--pine)] underline"
          >
            Basescan
          </a>
        )}
      </div>

      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        {qr && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={qr}
            alt="QR address del agente"
            width={168}
            height={168}
            className="border border-[var(--line)] bg-white p-2"
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
            <p className="mt-1 text-xs font-medium text-[var(--pine-deep)]">
              Fondos OK — siguiente: World
            </p>
          ) : (
            <p className="mt-1 text-xs text-[var(--clay)]">
              Mínimo ~${balances?.minUsdcToFund ?? 0.05} USDC para demos
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-3 text-xs">
            {fundHint?.faucetUsdc && (
              <a
                href={fundHint.faucetUsdc}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-[var(--pine)] underline"
              >
                Faucet USDC
              </a>
            )}
            {fundHint?.faucetEth && (
              <a
                href={fundHint.faucetEth}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-[var(--pine)] underline"
              >
                Faucet ETH
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
