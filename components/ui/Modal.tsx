"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  children: ReactNode;
  size?: "md" | "lg" | "xl";
  closeOnScrim?: boolean;
  closeOnEscape?: boolean;
};

const SIZE_CLASS = {
  md: "max-w-md",
  lg: "max-w-lg p-5 sm:p-6",
  xl: "max-w-2xl p-4 sm:p-6",
} as const;

/**
 * Overlay for HITL + “Mi agente”. Client-only when `open`.
 * No mounted-flag wait (that left the sheet invisible after tap).
 */
export function Modal({
  open,
  onClose,
  labelledBy,
  children,
  size = "md",
  closeOnScrim = true,
  closeOnEscape = true,
}: ModalProps) {
  const canPortal = typeof document !== "undefined";
  useBodyScrollLock(open && canPortal);

  useEffect(() => {
    if (!open || !closeOnEscape) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeOnEscape, onClose]);

  if (!open || !canPortal) return null;

  return createPortal(
    <div
      className="stay-modal-root flex flex-col justify-end sm:items-center sm:justify-center sm:p-4"
      role="presentation"
      data-agent-modal-root=""
    >
      <button
        type="button"
        aria-label="Cerrar"
        className="absolute inset-0 bg-[rgba(2,6,12,0.78)] backdrop-blur-[2px]"
        onClick={() => {
          if (closeOnScrim) onClose();
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={`stay-sheet relative isolate w-full rounded-t-2xl border border-[var(--line)] bg-[var(--sand)] shadow-[0_24px_80px_rgba(0,0,0,0.55)] sm:max-h-[min(92svh,840px)] sm:rounded-xl ${SIZE_CLASS[size]}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="stay-sheet-body">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
