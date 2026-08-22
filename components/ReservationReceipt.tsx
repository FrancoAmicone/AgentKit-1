"use client";

import type { ReactNode } from "react";
import { formatDateEs } from "@/lib/dates";

export type ReservationReceiptData = {
  listing?: {
    id: string;
    title: string;
    location: string;
    amountUsdc: number;
  };
  stay?: {
    checkIn: string;
    checkOut: string;
    nights: number;
  };
  reservation?: {
    reservedAt: string;
  };
  agentAddress?: string;
  txHash?: string;
  explorerUrl?: string;
  usedHumanApproval?: boolean;
  ogReceipt?: {
    ok: boolean;
    skipped?: boolean;
    rootHash?: string;
    txHash?: string;
    storageScanUrl?: string;
    explorerUrl?: string;
    error?: string;
  };
};

export function ReservationReceipt({
  purchase,
}: {
  purchase: ReservationReceiptData;
}) {
  const when = purchase.reservation?.reservedAt
    ? new Date(purchase.reservation.reservedAt).toLocaleString()
    : null;

  return (
    <section className="stay-rise stay-pulse-once mb-10 overflow-hidden border border-[var(--pine)]/20 bg-[var(--pine)]/[0.07]">
      <div className="border-b border-[var(--pine)]/15 px-5 py-4 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--pine)]">
          Reserva confirmada
        </p>
        <h2
          className="mt-1 text-3xl leading-tight text-[var(--pine)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {purchase.listing?.title || "Listo"}
        </h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          ${purchase.listing?.amountUsdc} USDC
          {purchase.usedHumanApproval ? " · con aprobación humana" : " · auto-pago"}
          {purchase.listing?.location ? ` · ${purchase.listing.location}` : ""}
          {when ? ` · ${when}` : ""}
        </p>
        {purchase.stay && (
          <p className="mt-1 text-sm font-medium text-[var(--pine)]">
            {formatDateEs(purchase.stay.checkIn)} →{" "}
            {formatDateEs(purchase.stay.checkOut)} · {purchase.stay.nights}{" "}
            noche{purchase.stay.nights === 1 ? "" : "s"}
          </p>
        )}
      </div>

      <div className="grid gap-0 sm:grid-cols-2">
        <ReceiptRow
          label="Pago onchain"
          body={
            purchase.explorerUrl ? (
              <a
                href={purchase.explorerUrl}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-[var(--pine)] underline underline-offset-2"
              >
                Ver tx en Basescan Sepolia
              </a>
            ) : purchase.txHash ? (
              <span className="break-all font-mono text-xs">{purchase.txHash}</span>
            ) : (
              <span>Liquidado (sin hash expuesto por el facilitator)</span>
            )
          }
        />
        <ReceiptRow
          label="Recibo 0G Storage"
          body={<OgBody og={purchase.ogReceipt} />}
        />
      </div>

      {purchase.agentAddress && (
        <div className="border-t border-[var(--pine)]/15 px-5 py-3 sm:px-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
            Wallet del agente
          </p>
          <p className="mt-1 break-all font-mono text-xs text-[var(--ink)]">
            {purchase.agentAddress}
          </p>
        </div>
      )}
    </section>
  );
}

function ReceiptRow({
  label,
  body,
}: {
  label: string;
  body: ReactNode;
}) {
  return (
    <div className="border-t border-[var(--pine)]/15 px-5 py-4 sm:border-t-0 sm:border-r sm:border-[var(--pine)]/15 sm:px-6 sm:last:border-r-0">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
        {label}
      </p>
      <div className="mt-2 text-sm text-[var(--ink)]">{body}</div>
    </div>
  );
}

function OgBody({
  og,
}: {
  og: ReservationReceiptData["ogReceipt"];
}) {
  if (og?.ok && og.rootHash) {
    return (
      <div className="space-y-2">
        <p className="break-all font-mono text-xs leading-relaxed text-[var(--ink)]">
          {og.rootHash}
        </p>
        <div className="flex flex-wrap gap-3 text-sm">
          {og.storageScanUrl && (
            <a
              href={og.storageScanUrl}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-[var(--pine)] underline underline-offset-2"
            >
              Storage Scan
            </a>
          )}
          {og.explorerUrl && (
            <a
              href={og.explorerUrl}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-[var(--pine)] underline underline-offset-2"
            >
              Tx 0G
            </a>
          )}
        </div>
      </div>
    );
  }
  if (og?.skipped) {
    return (
      <span className="text-[var(--muted)]">
        Omitido (falta OG_PRIVATE_KEY en el entorno)
      </span>
    );
  }
  if (og?.error) {
    return (
      <span className="text-[var(--clay)]">
        Pendiente: {og.error}
      </span>
    );
  }
  return <span className="text-[var(--muted)]">Sin recibo todavía</span>;
}
