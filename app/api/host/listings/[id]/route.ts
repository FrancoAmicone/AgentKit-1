import { NextRequest, NextResponse } from "next/server";
import { getHostId } from "@/lib/host-session";
import {
  isEvmAddress,
  updateHostListing,
  type HostListingPatch,
} from "@/lib/host-listings";
import { assertHostPayoutIsHumanBacked } from "@/lib/agentbook";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Update one of the host's properties: availability windows (the days it is
 * offered) and/or the per-property payout override.
 * Listing-level payTo overrides must also be World-verified when the host
 * gate is on.
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
    const override = patch.payoutAddress?.trim();
    if (override && isEvmAddress(override)) {
      const gate = await assertHostPayoutIsHumanBacked(override);
      if (!gate.ok) {
        return NextResponse.json(
          {
            ok: false,
            code: gate.code || "HOST_NOT_HUMAN_BACKED",
            error: gate.error,
          },
          { status: 403 },
        );
      }
    }

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
