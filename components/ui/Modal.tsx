"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { useMounted } from "@/hooks/useMounted";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  children: ReactNode;
  size?: "md" | "lg";
  closeOnScrim?: boolean;
  closeOnEscape?: boolean;
};

/**
 * Portal on document.body. Used only for HITL purchase approval — never
 * for “Mi agente” (that is a real page at /agent).
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
  const mounted = useMounted();
  useBodyScrollLock(open);

  useEffect(() => {
    if (!open || !closeOnEscape) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeOnEscape, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="stay-modal-root fixed inset-0 flex items-end justify-center sm:items-center sm:p-4"
      role="presentation"
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
        className={`relative isolate max-h-[min(92dvh,720px)] w-full overflow-y-auto overscroll-contain rounded-t-2xl border border-[var(--line)] bg-[var(--sand)] shadow-[0_24px_80px_rgba(0,0,0,0.55)] sm:rounded-xl ${
          size === "lg" ? "max-w-lg p-5 sm:p-6" : "max-w-md"
        }`}
        style={{ WebkitOverflowScrolling: "touch" }}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
