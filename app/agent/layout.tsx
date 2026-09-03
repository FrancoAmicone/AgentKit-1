import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mi agente — StayAgent",
  description:
    "Saldo USDC, wallet, verificación World y tope de auto-pago de tu agente.",
};

export default function AgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
