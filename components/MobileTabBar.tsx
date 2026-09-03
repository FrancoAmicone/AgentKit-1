"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Explorar", match: (p: string) => p === "/" || p.startsWith("/stays") },
  { href: "/host", label: "Anfitrión", match: (p: string) => p.startsWith("/host") },
  { href: "/agent", label: "Mi agente", match: (p: string) => p.startsWith("/agent") },
] as const;

export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--line)] bg-[var(--paper)]/92 backdrop-blur-md sm:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <ul className="mx-auto grid max-w-lg grid-cols-3">
        {TABS.map((tab) => {
          const active = tab.match(pathname);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                className={`flex min-h-12 items-center justify-center px-2 text-sm font-semibold ${
                  active
                    ? "text-[var(--pine)]"
                    : "text-[var(--muted)]"
                }`}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
