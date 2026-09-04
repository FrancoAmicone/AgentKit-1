"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Soft-nav on phones can leave body overflow/position locked after a modal
 * or a half-finished scroll. Reset the document on every route change.
 * Does not subscribe to agent session state (rerender-defer-reads).
 */
export function NavigationReset() {
  const pathname = usePathname();

  useEffect(() => {
    if (document.documentElement.dataset.stayModal === "open") return;

    const html = document.documentElement;
    const body = document.body;
    html.style.overflow = "";
    html.style.position = "";
    html.style.overscrollBehavior = "";
    body.style.overflow = "";
    body.style.position = "";
    body.style.top = "";
    body.style.left = "";
    body.style.right = "";
    body.style.width = "";
    body.style.paddingRight = "";

    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
