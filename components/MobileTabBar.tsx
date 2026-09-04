"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAgent } from "@/components/AgentSessionProvider";

export function MobileTabBar() {
  const pathname = usePathname();
  const agent = useAgent();
  const exploreActive =
    !agent.setupOpen && (pathname === "/" || pathname.startsWith("/stays"));
  const hostActive = !agent.setupOpen && pathname.startsWith("/host");
  const agentActive = agent.setupOpen || pathname.startsWith("/agent");

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--line)] bg-[var(--paper)]/92 backdrop-blur-md sm:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <ul className="mx-auto grid max-w-lg grid-cols-3">
        <li>
          <Link
            href="/"
            className={`flex min-h-12 items-center justify-center px-2 text-sm font-semibold ${
              exploreActive ? "text-[var(--pine)]" : "text-[var(--muted)]"
            }`}
          >
            Explorar
          </Link>
        </li>
        <li>
          <Link
            href="/host"
            className={`flex min-h-12 items-center justify-center px-2 text-sm font-semibold ${
              hostActive ? "text-[var(--pine)]" : "text-[var(--muted)]"
            }`}
          >
            Anfitrión
          </Link>
        </li>
        <li>
          <button
            type="button"
            onClick={() => agent.setSetupOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={agent.setupOpen}
            className={`flex min-h-12 w-full items-center justify-center px-2 text-sm font-semibold ${
              agentActive ? "text-[var(--pine)]" : "text-[var(--muted)]"
            }`}
          >
            Mi agente
          </button>
        </li>
      </ul>
    </nav>
  );
}
