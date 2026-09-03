import { NextRequest, NextResponse } from "next/server";
import { getHostId, getOrCreateHostId } from "@/lib/host-session";
import { getHostProfile, setHostPayoutWallet } from "@/lib/host-profile";
import {
  getHostBookStatus,
  isHumanBackedHostRequired,
} from "@/lib/agentbook";
import { isEvmAddress } from "@/lib/host-listings";

export const runtime = "nodejs";

/** Current host's profile (payout wallet) + World/AgentBook status. */
export async function GET() {
  const hostId = await getHostId();
  if (!hostId) {
    return NextResponse.json({
      ok: true,
      hostId: null,
      profile: null,
      world: null,
      hostWorldRequired: isHumanBackedHostRequired(),
    });
  }
  const profile = await getHostProfile(hostId);
  let world: Awaited<ReturnType<typeof getHostBookStatus>> | null = null;
  if (profile?.payoutAddress && isEvmAddress(profile.payoutAddress)) {
    try {
      world = await getHostBookStatus(profile.payoutAddress);
    } catch (err) {
      console.error("[host/profile] AgentBook lookup failed", err);
    }
  }
  return NextResponse.json({
    ok: true,
    hostId,
    profile,
    world,
    hostWorldRequired: isHumanBackedHostRequired(),
  });
}

/**
 * Register / update / clear (empty string) the host's payout wallet.
 * While no wallet is set, payments fall back to the marketplace wallet.
 * Changing the wallet clears World verification for the previous address
 * (the new address must be registered in AgentBook before publish).
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

    let world: Awaited<ReturnType<typeof getHostBookStatus>> | null = null;
    if (profile.payoutAddress && isEvmAddress(profile.payoutAddress)) {
      try {
        world = await getHostBookStatus(profile.payoutAddress);
      } catch (err) {
        console.error("[host/profile] AgentBook lookup failed", err);
      }
    }

    return NextResponse.json({
      ok: true,
      hostId,
      profile,
      world,
      hostWorldRequired: isHumanBackedHostRequired(),
      message: profile.payoutAddress
        ? world?.registered
          ? `Wallet de cobro registrada y verificada con World: ${profile.payoutAddress.slice(0, 6)}…${profile.payoutAddress.slice(-4)}`
          : `Wallet guardada: ${profile.payoutAddress.slice(0, 6)}…${profile.payoutAddress.slice(-4)}. Verificála con World App para poder publicar.`
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
