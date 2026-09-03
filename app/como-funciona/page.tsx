import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cómo funciona — StayAgent",
  description:
    "El recorrido completo: agente CDP por usuario, pago x402 en Base Sepolia, identidad World AgentBook, tope + aprobación humana y recibos en 0G Storage.",
};

const BUYER_STEPS = [
  {
    title: "1 · Creás tu agente",
    body: "En “Mi agente” ves el dashboard: creás una wallet CDP propia para tu navegador, el saldo USDC/ETH, World y el tope. Nadie comparte wallet.",
  },
  {
    title: "2 · Lo fondeás",
    body: "Le mandás USDC de testnet a esa dirección (QR + copy, faucets linkeados). El agente no puede gastar lo que no tiene.",
  },
  {
    title: "3 · Lo registrás con World",
    body: "Verificás con World App que hay un humano detrás del agente (AgentBook). Sin registro, el agente no puede pagar.",
  },
  {
    title: "4 · Definís el tope",
    body: "Elegís cuánto puede gastar solo por reserva (default $0.1 USDC). Todo lo que supere el tope requiere tu aprobación explícita en World App (HITL).",
  },
  {
    title: "5 · Buscás y reservás",
    body: "Pedís un lugar en lenguaje natural, elegís fechas libres en el calendario público y el agente paga el total (noches × precio) vía x402. La reserva bloquea esas noches para todos.",
  },
  {
    title: "6 · Queda el recibo",
    body: "El pago queda en Basescan y el recibo JSON de la reserva se sube a 0G Storage: auditoría durable fuera de la app.",
  },
];

const HOST_STEPS = [
  {
    title: "1 · Publicás tu propiedad",
    body: "Título, ubicación, descripción, precio por noche en USDC y, si querés, tu wallet de cobro. Queda al instante en el catálogo público.",
  },
  {
    title: "2 · Tu calendario es público",
    body: "Cualquier persona (o cualquier agente) puede ver qué noches están libres y cuáles bloqueadas, sin pagar ni registrarse.",
  },
  {
    title: "3 · Cobrás onchain",
    body: "Cuando el agente de un huésped paga, el x402 liquida USDC directo a tu wallet en Base Sepolia y esas noches se bloquean solas. En tu panel ves cada reserva con su tx.",
  },
];

const TECH = [
  {
    name: "CDP (Coinbase Developer Platform)",
    role: "Crea y custodia la wallet del agente de cada usuario; firma los pagos.",
  },
  {
    name: "x402",
    role: "Protocolo de pago HTTP: el endpoint de reserva responde 402 con el precio, el agente paga y reintenta. El precio es noches × precio/noche.",
  },
  {
    name: "World AgentBook",
    role: "Registro onchain de que el agente pagador está respaldado por un humano verificado con World ID.",
  },
  {
    name: "Tope + HITL",
    role: "Límite de auto-pago por agente. Sobre el tope, aprobación única en World App atada a ese alojamiento y ese monto exacto.",
  },
  {
    name: "0G Storage",
    role: "Recibo JSON de cada reserva (fechas, monto, tx, aprobación humana) subido a storage descentralizado.",
  },
];

export default function ComoFuncionaPage() {
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-5 pb-10 pt-8 sm:px-8">
      <header className="stay-rise mb-10 max-w-3xl">
        <h1
          className="text-[clamp(2rem,5vw,3.25rem)] leading-tight text-[var(--ink)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Cómo funciona StayAgent
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-[var(--muted)]">
          Dos lados, un mismo riel de pago: los huéspedes delegan la reserva en
          un agente con wallet propia; los anfitriones publican y cobran USDC
          onchain. Todo en testnet (Base Sepolia), sin dinero real.
        </p>
      </header>

      <section className="mb-12">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--pine)]">
          Lado huésped
        </p>
        <h2
          className="mt-1 text-2xl text-[var(--ink)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Tu agente compra por vos, con tus reglas
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BUYER_STEPS.map((step) => (
            <div
              key={step.title}
              className="border border-[var(--line)] bg-[var(--surface)] p-5"
            >
              <h3 className="text-sm font-semibold text-[var(--pine)]">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--clay)]">
          Lado anfitrión
        </p>
        <h2
          className="mt-1 text-2xl text-[var(--ink)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Publicar, mostrar disponibilidad, cobrar
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {HOST_STEPS.map((step) => (
            <div
              key={step.title}
              className="border border-[var(--line)] bg-[var(--surface)] p-5"
            >
              <h3 className="text-sm font-semibold text-[var(--clay)]">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <h2
          className="text-2xl text-[var(--ink)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Las piezas
        </h2>
        <div className="mt-5 overflow-hidden border border-[var(--line)] bg-[var(--surface)]">
          {TECH.map((item, i) => (
            <div
              key={item.name}
              className={`flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-baseline sm:gap-6 ${
                i > 0 ? "border-t border-[var(--line)]" : ""
              }`}
            >
              <p className="w-56 shrink-0 text-sm font-semibold text-[var(--ink)]">
                {item.name}
              </p>
              <p className="text-sm leading-relaxed text-[var(--muted)]">
                {item.role}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/"
          className="bg-[var(--pine)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--pine-deep)]"
        >
          Buscar estadía
        </Link>
        <Link
          href="/host"
          className="border border-[var(--clay)] px-5 py-2.5 text-sm font-semibold text-[var(--clay)] transition hover:bg-[var(--clay)] hover:text-white"
        >
          Publicar propiedad
        </Link>
      </div>
    </main>
  );
}
