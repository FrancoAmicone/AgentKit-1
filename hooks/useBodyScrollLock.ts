"use client";

import { useEffect } from "react";

const PASSIVE = { passive: true } as const;

type SavedOverflow = {
  htmlOverflow: string;
  htmlOverscroll: string;
  bodyOverflow: string;
  bodyOverscroll: string;
};

let lockCount = 0;
let saved: SavedOverflow | null = null;

function syncVisualViewport() {
  const vv = window.visualViewport;
  const root = document.documentElement;
  if (vv) {
    root.style.setProperty("--stay-vvh", `${Math.round(vv.height)}px`);
    root.style.setProperty("--stay-vvt", `${Math.round(vv.offsetTop)}px`);
  } else {
    root.style.setProperty("--stay-vvh", `${window.innerHeight}px`);
    root.style.setProperty("--stay-vvt", "0px");
  }
}

function attachViewportListeners() {
  const vv = window.visualViewport;
  vv?.addEventListener("resize", syncVisualViewport, PASSIVE);
  vv?.addEventListener("scroll", syncVisualViewport, PASSIVE);
  window.addEventListener("resize", syncVisualViewport, PASSIVE);
}

function detachViewportListeners() {
  const vv = window.visualViewport;
  vv?.removeEventListener("resize", syncVisualViewport, PASSIVE);
  vv?.removeEventListener("scroll", syncVisualViewport, PASSIVE);
  window.removeEventListener("resize", syncVisualViewport, PASSIVE);
}

function acquireLock() {
  if (lockCount === 0) {
    const html = document.documentElement;
    const body = document.body;
    saved = {
      htmlOverflow: html.style.overflow,
      htmlOverscroll: html.style.overscrollBehavior,
      bodyOverflow: body.style.overflow,
      bodyOverscroll: body.style.overscrollBehavior,
    };
    html.dataset.stayModal = "open";
    html.style.overflow = "hidden";
    html.style.overscrollBehavior = "none";
    body.style.overflow = "hidden";
    body.style.overscrollBehavior = "none";
    syncVisualViewport();
    attachViewportListeners();
  }
  lockCount += 1;
}

function releaseLock() {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount > 0 || !saved) return;

  const html = document.documentElement;
  const body = document.body;
  detachViewportListeners();
  html.style.removeProperty("--stay-vvh");
  html.style.removeProperty("--stay-vvt");
  delete html.dataset.stayModal;
  html.style.overflow = saved.htmlOverflow;
  html.style.overscrollBehavior = saved.htmlOverscroll;
  body.style.overflow = saved.bodyOverflow;
  body.style.overscrollBehavior = saved.bodyOverscroll;
  html.style.position = "";
  body.style.position = "";
  body.style.top = "";
  body.style.left = "";
  body.style.right = "";
  body.style.width = "";
  saved = null;
}

/**
 * Soft-lock background scroll while a modal is open.
 * Only overflow/overscroll — never position:fixed on body (that jumps the
 * page and, if the sheet unmounts dirty, leaves a blank locked screen).
 *
 * Also pins --stay-vvh / --stay-vvt to the visual viewport so the sheet
 * stays inside Safari’s toolbars instead of clipping under them.
 * Multiple open overlays share one lock + one listener set.
 */
export function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    acquireLock();
    return () => {
      releaseLock();
    };
  }, [locked]);
}
