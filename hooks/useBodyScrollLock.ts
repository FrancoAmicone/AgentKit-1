"use client";

import { useEffect } from "react";

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

/**
 * Soft-lock background scroll while a modal is open.
 * Only overflow/overscroll — never position:fixed on body (that jumps the
 * page and, if the sheet unmounts dirty, leaves a blank locked screen).
 *
 * Also pins --stay-vvh / --stay-vvt to the visual viewport so the sheet
 * stays inside Safari’s toolbars instead of clipping under them.
 */
export function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;

    const html = document.documentElement;
    const body = document.body;

    const prev = {
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

    const vv = window.visualViewport;
    vv?.addEventListener("resize", syncVisualViewport);
    vv?.addEventListener("scroll", syncVisualViewport);
    window.addEventListener("resize", syncVisualViewport);

    return () => {
      vv?.removeEventListener("resize", syncVisualViewport);
      vv?.removeEventListener("scroll", syncVisualViewport);
      window.removeEventListener("resize", syncVisualViewport);
      html.style.removeProperty("--stay-vvh");
      html.style.removeProperty("--stay-vvt");
      delete html.dataset.stayModal;
      html.style.overflow = prev.htmlOverflow;
      html.style.overscrollBehavior = prev.htmlOverscroll;
      body.style.overflow = prev.bodyOverflow;
      body.style.overscrollBehavior = prev.bodyOverscroll;
      html.style.position = "";
      body.style.position = "";
      body.style.top = "";
      body.style.left = "";
      body.style.right = "";
      body.style.width = "";
    };
  }, [locked]);
}
