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
  /** Wider dialog for setup / forms. */
  size?: "md" | "lg";
  closeOnScrim?: boolean;
  closeOnEscape?: boolean;
};

/**
 * Full-viewport portal modal on document.body so ancestor transforms /
 * stacking cannot trap it under listing images or other content.
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
      className="fixed inset-0 flex items-end justify-center sm:items-center sm:p-4"
      style={{ zIndex: 10000 }}
      role="presentation"
    >
      <button
        type="button"
        aria-label="Cerrar"
        className="absolute inset-0 bg-[rgba(26,36,33,0.72)]"
        onClick={() => {
          if (closeOnScrim) onClose();
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={`relative isolate max-h-[min(92vh,720px)] w-full overflow-y-auto rounded-t-2xl border border-[var(--line)] bg-[var(--paper)] shadow-[0_24px_80px_rgba(26,36,33,0.45)] sm:rounded-2xl ${
          size === "lg" ? "max-w-lg p-5 sm:p-6" : "max-w-md"
        }`}
        style={{ zIndex: 10001 }}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
