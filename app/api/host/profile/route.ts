import { NextRequest, NextResponse } from "next/server";
import { getHostId, getOrCreateHostId } from "@/lib/host-session";
import { getHostProfile, setHostPayoutWallet } from "@/lib/host-profile";

export const runtime = "nodejs";

/** Current host's profile (payout wallet anchored to all their properties). */
export async function GET() {
  const hostId = await getHostId();
  if (!hostId) {
    return NextResponse.json({ ok: true, hostId: null, profile: null });
  }
  const profile = await getHostProfile(hostId);
  return NextResponse.json({ ok: true, hostId, profile });
}

/**
 * Register / update / clear (empty string) the host's payout wallet.
 * While no wallet is set, payments fall back to the marketplace wallet.
 */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    payoutAddress?: string;
  };

  try {
    const hostId = await getOrCreateHostId();
    const profile = await setHostPayoutWallet(
      hostId,
      String(body.payoutAddress ?? ""),
    );
    return NextResponse.json({
      ok: true,
      hostId,
      profile,
      message: profile.payoutAddress
        ? `Wallet de cobro registrada: tus propiedades cobran en ${profile.payoutAddress.slice(0, 6)}…${profile.payoutAddress.slice(-4)}`
        : "Wallet de cobro borrada: tus propiedades vuelven a cobrar en la wallet del marketplace.",
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "No se pudo guardar la wallet",
      },
      { status: 400 },
    );
  }
}
