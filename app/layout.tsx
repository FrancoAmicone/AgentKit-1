import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AgentModal } from "@/components/AgentModal";
import { AgentSessionProvider } from "@/components/AgentSessionProvider";
import { MobileTabBar } from "@/components/MobileTabBar";
import { NavigationReset } from "@/components/NavigationReset";
import { SiteHeader } from "@/components/SiteHeader";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#070b12",
};

export const metadata: Metadata = {
  title: "StayAgent — reservá y publicá con pago onchain",
  description:
    "Marketplace de estadías donde tu agente busca, reserva y paga en USDC (Base Sepolia) vía x402 + CDP, y los anfitriones publican y cobran onchain.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body className="antialiased">
        <AgentSessionProvider>
          <div className="app-root">
            <NavigationReset />
            <SiteHeader />
            {children}
            <footer className="mx-auto max-w-6xl px-5 pb-8 pt-14 text-xs tracking-wide text-[var(--muted)] sm:px-8">
              Base Sepolia · x402 · World · 0G Storage — demo testnet, sin dinero
              real.
            </footer>
            <MobileTabBar />
          </div>
          <AgentModal />
        </AgentSessionProvider>
      </body>
    </html>
  );
}
