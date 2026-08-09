"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { AvailabilityCalendar } from "@/components/AvailabilityCalendar";
import { formatDateEs, type DateRange } from "@/lib/dates";

type HostBooking = {
  id: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  amountUsdc: number;
  guestAgentAddress?: string;
  txHash?: string;
  usedHumanApproval?: boolean;
  createdAt: string;
};

type HostListing = {
  id: string;
  title: string;
  location: string;
  description: string;
  pricePerNight: number;
  amenities: string[];
  imageUrl: string;
  maxGuests: number;
  payoutAddress?: string;
  createdAt: string;
  bookings: HostBooking[];
  bookedRanges: DateRange[];
  stats: { nightsBooked: number; totalUsdc: number };
};

type HostData = {
  ok: boolean;
  hostId: string | null;
  listings: HostListing[];
};

const EMPTY_FORM = {
  title: "",
  location: "",
  description: "",
  pricePerNight: "0.05",
  maxGuests: "4",
  amenities: "wifi, cochera",
  imageUrl: "",
  payoutAddress: "",
};

export default function HostPage() {
  const [data, setData] = useState<HostData | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string; url?: string } | null>(
    null,
  );

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/host/listings");
      const payload = (await res.json()) as HostData;
      setData(payload);
    } catch {
      setData({ ok: false, hostId: null, listings: [] });
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await refresh();
    })();
  }, [refresh]);

  function setField(name: keyof typeof EMPTY_FORM, value: string) {
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function onPublish(e: FormEvent) {
    e.preventDefault();
    setPublishing(true);
    setMessage(null);
    try {
      const res = await fetch("/api/host/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          location: form.location,
          description: form.description,
          pricePerNight: Number(form.pricePerNight),
          maxGuests: Number(form.maxGuests),
          amenities: form.amenities,
          imageUrl: form.imageUrl || undefined,
          payoutAddress: form.payoutAddress || undefined,
        }),
      });
      const payload = (await res.json()) as {
        ok: boolean;
        error?: string;
        message?: string;
        publicUrl?: string;
      };
      if (!res.ok || !payload.ok) {
        throw new Error(payload.error || "No se pudo publicar");
      }
      setMessage({
        ok: true,
        text: payload.message || "Propiedad publicada",
        url: payload.publicUrl,
      });
      setForm(EMPTY_FORM);
      await refresh();
    } catch (err) {
      setMessage({
        ok: false,
        text: err instanceof Error ? err.message : "Error al publicar",
      });
    } finally {
      setPublishing(false);
    }
  }

  const listings = data?.listings ?? [];

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-5 pb-10 pt-8 sm:px-8">
      <header className="stay-rise mb-8 max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--clay)]">
          Modo anfitrión
        </p>
        <h1
          className="mt-1 text-[clamp(2rem,5vw,3.25rem)] leading-tight text-[var(--ink)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Publicá tu propiedad, cobrá onchain
        </h1>
        <p className="mt-3 max-w-xl text-base leading-relaxed text-[var(--muted)]">
          Cargá tu casa, depto o cabaña. Queda visible en el catálogo con su
          calendario público: cuando el agente de un huésped paga la reserva
          (x402, USDC en Base Sepolia), esas noches se bloquean solas y el pago
          va a tu wallet.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[400px_minmax(0,1fr)]">
        {/* Publish form */}
        <section className="stay-rise-delay lg:sticky lg:top-20 lg:self-start">
          <form
            onSubmit={onPublish}
            className="border border-[var(--line)] bg-white/55 p-5"
          >
            <h2
              className="text-xl text-[var(--ink)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Nueva propiedad
            </h2>

            <Field label="Título">
              <input
                value={form.title}
                onChange={(e) => setField("title", e.target.value)}
                placeholder="Cabaña con vista al valle"
                required
                className="w-full border border-[var(--line)] bg-white/70 px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--pine)]/50"
              />
            </Field>

            <Field label="Ubicación">
              <input
                value={form.location}
                onChange={(e) => setField("location", e.target.value)}
                placeholder="Tafí del Valle, Tucumán"
                required
                className="w-full border border-[var(--line)] bg-white/70 px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--pine)]/50"
              />
            </Field>

            <Field label="Descripción">
              <textarea
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                placeholder="Contá qué hace especial a tu lugar…"
                required
                rows={3}
                className="w-full resize-y border border-[var(--line)] bg-white/70 px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--pine)]/50"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Precio/noche (USDC)">
                <input
                  value={form.pricePerNight}
                  onChange={(e) => setField("pricePerNight", e.target.value)}
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  className="w-full border border-[var(--line)] bg-white/70 px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--pine)]/50"
                />
              </Field>
              <Field label="Huéspedes máx.">
                <input
                  value={form.maxGuests}
                  onChange={(e) => setField("maxGuests", e.target.value)}
                  type="number"
                  min="1"
                  max="20"
                  required
                  className="w-full border border-[var(--line)] bg-white/70 px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--pine)]/50"
                />
              </Field>
            </div>

            <Field label="Amenities (separados por coma)">
              <input
                value={form.amenities}
                onChange={(e) => setField("amenities", e.target.value)}
                placeholder="wifi, pileta, parrilla"
                className="w-full border border-[var(--line)] bg-white/70 px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--pine)]/50"
              />
            </Field>

            <Field label="Foto (URL https, opcional)">
              <input
                value={form.imageUrl}
                onChange={(e) => setField("imageUrl", e.target.value)}
                placeholder="https://…"
                className="w-full border border-[var(--line)] bg-white/70 px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--pine)]/50"
              />
            </Field>

            <Field label="Wallet de cobro (0x…, opcional)">
              <input
                value={form.payoutAddress}
                onChange={(e) => setField("payoutAddress", e.target.value)}
                placeholder="0x… (si no, cobra el marketplace demo)"
                className="w-full border border-[var(--line)] bg-white/70 px-3 py-2 font-mono text-xs text-[var(--ink)] outline-none focus:border-[var(--pine)]/50"
              />
            </Field>

            <button
              type="submit"
              disabled={publishing}
              className="mt-4 w-full bg-[var(--clay)] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {publishing ? "Publicando…" : "Publicar propiedad"}
            </button>

            {message && (
              <p
                className={`mt-3 text-sm ${
                  message.ok ? "text-[var(--pine-deep)]" : "text-[var(--danger)]"
                }`}
              >
                {message.text}
                {message.url && (
                  <>
                    {" · "}
                    <Link
                      href={message.url}
                      className="font-semibold underline underline-offset-2"
                    >
                      Ver página pública
                    </Link>
                  </>
                )}
              </p>
            )}
          </form>
        </section>

        {/* My properties */}
        <section className="stay-fade">
          <div className="mb-4 flex items-end justify-between">
            <h2
              className="text-2xl text-[var(--ink)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Mis propiedades
            </h2>
            <p className="text-xs text-[var(--muted)]">
              {listings.length} publicada{listings.length === 1 ? "" : "s"}
            </p>
          </div>

          {data && listings.length === 0 && (
            <div className="border border-dashed border-[var(--line)] bg-white/30 p-8 text-center">
              <p className="text-sm text-[var(--muted)]">
                Todavía no publicaste nada en este navegador.
                <br />
                Cargá tu primera propiedad con el formulario — aparece al
                instante en el catálogo público.
              </p>
            </div>
          )}

          <div className="space-y-6">
            {listings.map((listing) => (
              <article
                key={listing.id}
                className="overflow-hidden border border-[var(--line)] bg-white/55"
              >
                <div className="flex flex-col gap-0 sm:flex-row">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={listing.imageUrl}
                    alt={listing.title}
                    className="h-40 w-full object-cover sm:h-auto sm:w-48"
                  />
                  <div className="flex-1 p-4 sm:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3
                          className="text-xl text-[var(--ink)]"
                          style={{ fontFamily: "var(--font-display)" }}
                        >
                          {listing.title}
                        </h3>
                        <p className="mt-0.5 text-sm text-[var(--muted)]">
                          {listing.location} · ${listing.pricePerNight}/noche
                        </p>
                      </div>
                      <Link
                        href={`/stays/${listing.id}`}
                        className="text-sm font-semibold text-[var(--pine)] underline-offset-2 hover:underline"
                      >
                        Ver página pública →
                      </Link>
                    </div>
                    <p className="mt-2 text-sm text-[var(--muted)]">
                      {listing.stats.nightsBooked} noche
                      {listing.stats.nightsBooked === 1 ? "" : "s"} reservada
                      {listing.stats.nightsBooked === 1 ? "" : "s"} · $
                      {listing.stats.totalUsdc} USDC cobrados
                    </p>
                    {listing.payoutAddress && (
                      <p className="mt-1 break-all font-mono text-[11px] text-[var(--muted)]">
                        Cobra en {listing.payoutAddress}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid gap-5 border-t border-[var(--line)] p-4 sm:grid-cols-2 sm:p-5">
                  <div>
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                      Fechas bloqueadas
                    </p>
                    <AvailabilityCalendar
                      bookedRanges={listing.bookedRanges}
                      readOnly
                      months={1}
                      compact
                    />
                  </div>
                  <div>
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                      Reservas recibidas
                    </p>
                    {listing.bookings.length === 0 ? (
                      <p className="text-sm text-[var(--muted)]">
                        Ninguna todavía. Compartí la página pública: cualquier
                        huésped (o su agente) puede reservar.
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {listing.bookings.map((b) => (
                          <li
                            key={b.id}
                            className="border border-[var(--line)] bg-white/60 px-3 py-2 text-xs"
                          >
                            <p className="font-semibold text-[var(--ink)]">
                              {formatDateEs(b.checkIn)} →{" "}
                              {formatDateEs(b.checkOut)} · {b.nights} noche
                              {b.nights === 1 ? "" : "s"} · ${b.amountUsdc}{" "}
                              USDC
                              {b.usedHumanApproval ? " · aprobada en World" : ""}
                            </p>
                            <p className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[var(--muted)]">
                              {b.guestAgentAddress && (
                                <span className="font-mono">
                                  agente {b.guestAgentAddress.slice(0, 6)}…
                                  {b.guestAgentAddress.slice(-4)}
                                </span>
                              )}
                              {b.txHash && (
                                <a
                                  href={`https://sepolia.basescan.org/tx/${b.txHash}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="font-semibold text-[var(--pine)] underline underline-offset-2"
                                >
                                  tx en Basescan
                                </a>
                              )}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>

          <p className="mt-6 text-xs leading-relaxed text-[var(--muted)]">
            Nota demo: tu identidad de anfitrión vive en una cookie de este
            navegador y las propiedades se guardan en un archivo del servidor
            (testnet, sin dinero real). Si no cargás wallet de cobro, el pago
            va a la wallet marketplace del demo.
          </p>
        </section>
      </div>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="mt-3 block">
      <span className="mb-1 block text-xs font-semibold text-[var(--muted)]">
        {label}
      </span>
      {children}
    </label>
  );
}
