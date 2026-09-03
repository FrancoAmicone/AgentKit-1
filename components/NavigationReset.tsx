"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useAgent } from "@/components/AgentSessionProvider";

/**
 * Soft-nav on phones can leave body overflow/position locked after a modal
 * or a half-finished scroll. Reset the document on every route change.
 */
export function NavigationReset() {
  const pathname = usePathname();
  const agent = useAgent();

  useEffect(() => {
    agent.setSetupOpen(false);

    const html = document.documentElement;
    const body = document.body;
    html.style.overflow = "";
    html.style.overscrollBehavior = "";
    body.style.overflow = "";
    body.style.position = "";
    body.style.top = "";
    body.style.width = "";
    body.style.paddingRight = "";

    window.scrollTo(0, 0);
    // Close the setup sheet when leaving the page that opened it.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on route change
  }, [pathname]);

  return null;
}
