"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { AvailabilityCalendar } from "@/components/AvailabilityCalendar";
import { AgentRegisterPanel } from "@/components/AgentRegisterPanel";
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
  availabilityWindows?: DateRange[];
  createdAt: string;
  bookings: HostBooking[];
  bookedRanges: DateRange[];
  stats: { nightsBooked: number; totalUsdc: number };
  payout: {
    address: string | null;
    source: "listing" | "host" | "marketplace";
  };
};

type HostProfile = {
  hostId: string;
  payoutAddress?: string;
  updatedAt: string;
};

type HostWorld = {
  address: string;
  registered: boolean;
  humanId: string | null;
  required: boolean;
};

type HostData = {
  ok: boolean;
  hostId: string | null;
  profile: HostProfile | null;
  world: HostWorld | null;
  hostWorldRequired?: boolean;
  canPublish?: boolean;
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

function shortAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export default function HostPage() {
  const router = useRouter();
  const [data, setData] = useState<HostData | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formWindows, setFormWindows] = useState<DateRange[]>([]);
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
      setData({
        ok: false,
        hostId: null,
        profile: null,
        world: null,
        listings: [],
      });
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

  const hostWorldRequired = data?.hostWorldRequired !== false;
  const worldRegistered = Boolean(data?.world?.registered);
  const canPublish =
    data?.canPublish ??
    (!hostWorldRequired ||
      (Boolean(data?.profile?.payoutAddress) && worldRegistered));

  async function onPublish(e: FormEvent) {
    e.preventDefault();
    if (!canPublish) {
      setMessage({
        ok: false,
        text: "Verificá tu wallet de cobro con World App antes de publicar.",
      });
      return;
    }
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
          availabilityWindows: formWindows.length > 0 ? formWindows : undefined,
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
      setFormWindows([]);
      await refresh();
      // Hard navigation so /stays/[id] always hits the server fresh
      // (avoids soft-nav cache races right after publish).
      if (payload.publicUrl) {
        router.push(payload.publicUrl);
      }
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
          Registrá tu wallet de cobro, verificála con World (igual que el
          huésped) y queda anclada a todas tus propiedades. Cuando el agente
          de un huésped paga (x402, USDC en Base Sepolia), esas noches se
          bloquean solas y el pago va a tu wallet.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[400px_minmax(0,1fr)]">
        {/* Left column: wallet + World + publish form */}
        <section className="stay-rise-delay space-y-6 lg:sticky lg:top-20 lg:self-start">
          <WalletPanel
            profile={data?.profile ?? null}
            world={data?.world ?? null}
            hostWorldRequired={hostWorldRequired}
            onSaved={refresh}
          />

          <form
            onSubmit={onPublish}
            className="border border-[var(--line)] bg-[var(--surface)] p-5"
          >
            <h2
              className="text-xl text-[var(--ink)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Nueva propiedad
            </h2>

            {hostWorldRequired && !canPublish && (
              <p className="mt-2 text-xs leading-relaxed text-[var(--clay)]">
                Para publicar: registrá tu wallet arriba y verificála con World
                App. Sin eso no se acepta el alta.
              </p>
            )}

            <Field label="Título">
              <input
                value={form.title}
                onChange={(e) => setField("title", e.target.value)}
                placeholder="Cabaña con vista al valle"
                required
                className="w-full border border-[var(--line)] bg-[var(--surface-strong)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--pine)]/50"
              />
            </Field>

            <Field label="Ubicación">
              <input
                value={form.location}
                onChange={(e) => setField("location", e.target.value)}
                placeholder="Tafí del Valle, Tucumán"
                required
                className="w-full border border-[var(--line)] bg-[var(--surface-strong)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--pine)]/50"
              />
            </Field>

            <Field label="Descripción">
              <textarea
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                placeholder="Contá qué hace especial a tu lugar…"
                required
                rows={3}
                className="w-full resize-y border border-[var(--line)] bg-[var(--surface-strong)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--pine)]/50"
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
                  className="w-full border border-[var(--line)] bg-[var(--surface-strong)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--pine)]/50"
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
                  className="w-full border border-[var(--line)] bg-[var(--surface-strong)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--pine)]/50"
                />
              </Field>
            </div>

            <Field label="Amenities (separados por coma)">
              <input
                value={form.amenities}
                onChange={(e) => setField("amenities", e.target.value)}
                placeholder="wifi, pileta, parrilla"
                className="w-full border border-[var(--line)] bg-[var(--surface-strong)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--pine)]/50"
              />
            </Field>

            <Field label="Foto (URL https, opcional)">
              <input
                value={form.imageUrl}
                onChange={(e) => setField("imageUrl", e.target.value)}
                placeholder="https://…"
                className="w-full border border-[var(--line)] bg-[var(--surface-strong)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--pine)]/50"
              />
            </Field>

            <div className="mt-3">
              <span className="mb-1 block text-xs font-semibold text-[var(--muted)]">
                Días disponibles (opcional — sin ventanas, se ofrece siempre)
              </span>
              <WindowsEditor windows={formWindows} onChange={setFormWindows} />
            </div>

            <Field label="Wallet de cobro solo para esta propiedad (opcional)">
              <input
                value={form.payoutAddress}
                onChange={(e) => setField("payoutAddress", e.target.value)}
                placeholder="0x… (si no, aplica tu wallet de anfitrión)"
                className="w-full border border-[var(--line)] bg-[var(--surface-strong)] px-3 py-2 font-mono text-xs text-[var(--ink)] outline-none focus:border-[var(--pine)]/50"
              />
            </Field>

            <button
              type="submit"
              disabled={publishing || !canPublish}
              className="mt-4 w-full bg-[var(--clay)] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {publishing
                ? "Publicando…"
                : !canPublish
                  ? "Verificá con World para publicar"
                  : "Publicar propiedad"}
            </button>

            {message && (
              <p
                className={`mt-3 text-sm ${
                  message.ok ? "text-[var(--pine)]" : "text-[var(--danger)]"
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
            <div className="border border-dashed border-[var(--line)] bg-[var(--surface)] p-8 text-center">
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
              <PropertyCard
                key={listing.id}
                listing={listing}
                onChanged={refresh}
              />
            ))}
          </div>

          <p className="mt-6 text-xs leading-relaxed text-[var(--muted)]">
            Nota demo: tu identidad de anfitrión vive en una cookie de este
            navegador y los datos se guardan en archivos del servidor
            (testnet, sin dinero real). Wallet de cobro + verificación World
            son obligatorias para publicar (salvo bypass de env).
          </p>
        </section>
      </div>
    </main>
  );
}

/** Host-level payout wallet + World/AgentBook verification. */
function WalletPanel({
  profile,
  world,
  hostWorldRequired,
  onSaved,
}: {
  profile: HostProfile | null;
  world: HostWorld | null;
  hostWorldRequired: boolean;
  onSaved: () => Promise<void>;
}) {
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);

  async function save(payoutAddress: string) {
    setSaving(true);
    setNote(null);
    try {
      const res = await fetch("/api/host/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payoutAddress }),
      });
      const payload = (await res.json()) as {
        ok: boolean;
        error?: string;
        message?: string;
      };
      if (!res.ok || !payload.ok) {
        throw new Error(payload.error || "No se pudo guardar la wallet");
      }
      setNote({ ok: true, text: payload.message || "Guardado" });
      setInput("");
      await onSaved();
    } catch (err) {
      setNote({
        ok: false,
        text: err instanceof Error ? err.message : "Error al guardar",
      });
    } finally {
      setSaving(false);
    }
  }

  const registered = Boolean(world?.registered);

  return (
    <div className="border border-[var(--line)] bg-[var(--surface)] p-5">
      <h2
        className="text-xl text-[var(--ink)]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Tu wallet de cobro
      </h2>
      {profile?.payoutAddress ? (
        <>
          <p className="mt-2 break-all font-mono text-xs text-[var(--ink)]">
            {profile.payoutAddress}
          </p>
          <p
            className={`mt-2 text-xs font-semibold ${
              registered ? "text-[var(--pine)]" : "text-[var(--clay)]"
            }`}
          >
            {registered
              ? "World / AgentBook ✓ — podés publicar"
              : hostWorldRequired
                ? "Pendiente: verificá con World App para publicar"
                : "Sin verificación World (bypass activo)"}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">
            Anclada a todas tus propiedades (salvo que una tenga su propia
            wallet). El x402 liquida el USDC acá.
          </p>
        </>
      ) : (
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
          Registrá tu wallet <strong>0x…</strong> y verificála con World —
          simétrico al huésped. Sin eso no podés publicar (el marketplace solo
          queda como fallback legacy).
        </p>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void save(input);
        }}
        className="mt-3 flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="0x…"
          className="min-w-0 flex-1 border border-[var(--line)] bg-[var(--surface-strong)] px-3 py-2 font-mono text-xs text-[var(--ink)] outline-none focus:border-[var(--pine)]/50"
          aria-label="Wallet de cobro del anfitrión"
        />
        <button
          type="submit"
          disabled={saving || !input.trim()}
          className="bg-[var(--pine)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--pine-deep)] disabled:opacity-50"
        >
          {saving ? "…" : profile?.payoutAddress ? "Cambiar" : "Registrar"}
        </button>
      </form>

      {profile?.payoutAddress && (
        <button
          type="button"
          onClick={() => void save("")}
          disabled={saving}
          className="mt-2 text-xs font-semibold text-[var(--muted)] underline underline-offset-2 hover:text-[var(--danger)]"
        >
          Borrar (volver a la wallet del marketplace)
        </button>
      )}

      {note && (
        <p
          className={`mt-2 text-xs ${
            note.ok ? "text-[var(--pine)]" : "text-[var(--danger)]"
          }`}
        >
          {note.text}
        </p>
      )}

      {profile?.payoutAddress && !registered && (
        <div className="mt-4 border-t border-[var(--line)] pt-4">
          <p
            className="mb-2 text-sm font-semibold text-[var(--ink)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Verificar con World
          </p>
          <AgentRegisterPanel
            prepareUrl="/api/host/register/prepare"
            completeUrl="/api/host/register/complete"
            actionDescriptionFallback="Register StayAgent host payout wallet in AgentBook"
            idleLabel="Verificar wallet con World App"
            doneLabel="Wallet verificada ✓"
            intro={
              <>
                Misma prueba World ID que el huésped, pero sobre{" "}
                <strong className="text-[var(--ink)]">tu wallet de cobro</strong>
                . Abrí World App una sola vez o escaneá el QR.
              </>
            }
            onRegistered={() => {
              void onSaved();
            }}
          />
        </div>
      )}
    </div>
  );
}

/** Add/remove availability windows (half-open: hasta = día de checkout). */
function WindowsEditor({
  windows,
  onChange,
  saving = false,
}: {
  windows: DateRange[];
  onChange: (windows: DateRange[]) => void;
  saving?: boolean;
}) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [error, setError] = useState<string | null>(null);

  function addWindow() {
    setError(null);
    if (!from || !to) {
      setError("Completá desde y hasta.");
      return;
    }
    if (from >= to) {
      setError("“Hasta” debe ser posterior a “desde”.");
      return;
    }
    onChange(
      [...windows, { checkIn: from, checkOut: to }].sort((a, b) =>
        a.checkIn.localeCompare(b.checkIn),
      ),
    );
    setFrom("");
    setTo("");
  }

  return (
    <div>
      {windows.length > 0 && (
        <ul className="mb-2 space-y-1">
          {windows.map((w, i) => (
            <li
              key={`${w.checkIn}-${w.checkOut}-${i}`}
              className="flex items-center justify-between gap-2 border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1.5 text-xs text-[var(--ink)]"
            >
              <span>
                {formatDateEs(w.checkIn)} → {formatDateEs(w.checkOut)}
              </span>
              <button
                type="button"
                disabled={saving}
                onClick={() => onChange(windows.filter((_, j) => j !== i))}
                aria-label="Quitar ventana"
                className="px-1 font-semibold text-[var(--muted)] hover:text-[var(--danger)]"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          aria-label="Disponible desde"
          className="border border-[var(--line)] bg-[var(--surface-strong)] px-2 py-1.5 text-xs text-[var(--ink)] outline-none focus:border-[var(--pine)]/50"
        />
        <span className="text-xs text-[var(--muted)]">→</span>
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          aria-label="Disponible hasta (checkout)"
          className="border border-[var(--line)] bg-[var(--surface-strong)] px-2 py-1.5 text-xs text-[var(--ink)] outline-none focus:border-[var(--pine)]/50"
        />
        <button
          type="button"
          onClick={addWindow}
          disabled={saving}
          className="border border-[var(--pine)] px-3 py-1.5 text-xs font-semibold text-[var(--pine)] transition hover:bg-[var(--pine)] hover:text-white disabled:opacity-50"
        >
          Agregar
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-[var(--danger)]">{error}</p>}
    </div>
  );
}

function PropertyCard({
  listing,
  onChanged,
}: {
  listing: HostListing;
  onChanged: () => Promise<void>;
}) {
  const [savingWindows, setSavingWindows] = useState(false);
  const [windowsNote, setWindowsNote] = useState<string | null>(null);

  async function saveWindows(windows: DateRange[]) {
    setSavingWindows(true);
    setWindowsNote(null);
    try {
      const res = await fetch(`/api/host/listings/${listing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ availabilityWindows: windows }),
      });
      const payload = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !payload.ok) {
        throw new Error(payload.error || "No se pudo actualizar");
      }
      await onChanged();
    } catch (err) {
      setWindowsNote(
        err instanceof Error ? err.message : "Error al actualizar disponibilidad",
      );
    } finally {
      setSavingWindows(false);
    }
  }

  const payoutLabel =
    listing.payout.source === "listing"
      ? `Cobra en ${shortAddress(listing.payout.address!)} (wallet de esta propiedad)`
      : listing.payout.source === "host"
        ? `Cobra en ${shortAddress(listing.payout.address!)} (tu wallet de anfitrión)`
        : "Cobra en la wallet del marketplace (registrá tu wallet arriba)";

  return (
    <article className="overflow-hidden border border-[var(--line)] bg-[var(--surface)]">
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
          <p
            className={`mt-1 text-xs ${
              listing.payout.source === "marketplace"
                ? "text-[var(--clay)]"
                : "text-[var(--muted)]"
            }`}
          >
            {payoutLabel}
          </p>
        </div>
      </div>

      <div className="grid gap-5 border-t border-[var(--line)] p-4 sm:grid-cols-2 sm:p-5">
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
            Calendario (reservas + días ofrecidos)
          </p>
          <AvailabilityCalendar
            bookedRanges={listing.bookedRanges}
            availabilityWindows={listing.availabilityWindows}
            readOnly
            months={1}
            compact
          />
          <p className="mb-2 mt-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
            Días disponibles
          </p>
          <WindowsEditor
            windows={listing.availabilityWindows ?? []}
            onChange={(w) => void saveWindows(w)}
            saving={savingWindows}
          />
          {(listing.availabilityWindows ?? []).length === 0 && (
            <p className="mt-1 text-xs text-[var(--muted)]">
              Sin ventanas: se ofrece todo el año.
            </p>
          )}
          {windowsNote && (
            <p className="mt-1 text-xs text-[var(--danger)]">{windowsNote}</p>
          )}
        </div>
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
            Reservas recibidas
          </p>
          {listing.bookings.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">
              Ninguna todavía. Compartí la página pública: cualquier huésped
              (o su agente) puede reservar.
            </p>
          ) : (
            <ul className="space-y-2">
              {listing.bookings.map((b) => (
                <li
                  key={b.id}
                  className="border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-xs"
                >
                  <p className="font-semibold text-[var(--ink)]">
                    {formatDateEs(b.checkIn)} → {formatDateEs(b.checkOut)} ·{" "}
                    {b.nights} noche
                    {b.nights === 1 ? "" : "s"} · ${b.amountUsdc} USDC
                    {b.usedHumanApproval ? " · aprobada en World" : ""}
                  </p>
                  <p className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[var(--muted)]">
                    {b.guestAgentAddress && (
                      <span className="font-mono">
                        agente {shortAddress(b.guestAgentAddress)}
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
