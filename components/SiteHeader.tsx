"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { StatusBadge } from "@/components/AgentSetupModal";
import { useAgent } from "@/components/AgentSessionProvider";

const NAV = [
  { href: "/", label: "Explorar" },
  { href: "/host", label: "Modo anfitrión" },
  { href: "/como-funciona", label: "Cómo funciona" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const agent = useAgent();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--paper)]/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-5 py-3 sm:px-8">
        <Link
          href="/"
          className="text-xl tracking-tight text-[var(--ink)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          StayAgent
        </Link>

        <nav className="order-3 flex w-full items-center gap-1 sm:order-none sm:w-auto sm:gap-2">
          {NAV.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/" || pathname.startsWith("/stays")
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 text-sm transition ${
                  active
                    ? "bg-[var(--pine)]/10 font-semibold text-[var(--pine-deep)]"
                    : "text-[var(--muted)] hover:bg-black/5 hover:text-[var(--ink)]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={() => agent.setSetupOpen(true)}
          className="ml-auto inline-flex items-center gap-2 border border-[var(--line)] bg-white/50 px-3 py-1.5 transition hover:border-[var(--pine)]/35 hover:bg-white/80"
        >
          <StatusBadge status={agent.agentStatus} />
          <span className="text-xs font-semibold text-[var(--pine)]">
            Mi agente
          </span>
        </button>
      </div>
    </header>
  );
}
