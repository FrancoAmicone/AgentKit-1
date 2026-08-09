import { NextRequest, NextResponse } from "next/server";
import { getHostId } from "@/lib/host-session";
import { updateHostListing, type HostListingPatch } from "@/lib/host-listings";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Update one of the host's properties: availability windows (the days it is
 * offered) and/or the per-property payout override.
 */
export async function PATCH(request: NextRequest, context: Ctx) {
  const { id } = await context.params;
  const hostId = await getHostId();
  if (!hostId) {
    return NextResponse.json(
      { ok: false, error: "No hay sesión de anfitrión en este navegador." },
      { status: 403 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const patch: HostListingPatch = {};
  if ("availabilityWindows" in body) {
    patch.availabilityWindows = body.availabilityWindows as HostListingPatch["availabilityWindows"];
  }
  if ("payoutAddress" in body) {
    patch.payoutAddress = String(body.payoutAddress ?? "");
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json(
      { ok: false, error: "Nada para actualizar." },
      { status: 400 },
    );
  }

  try {
    const listing = await updateHostListing(hostId, id, patch);
    return NextResponse.json({ ok: true, listing });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "No se pudo actualizar",
      },
      { status: 400 },
    );
  }
}
