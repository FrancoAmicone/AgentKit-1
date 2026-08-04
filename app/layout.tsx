import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StayAgent — reserve con pago onchain",
  description:
    "Agente que busca alojamientos y paga la reserva en USDC (Base Sepolia) vía x402 + CDP.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
