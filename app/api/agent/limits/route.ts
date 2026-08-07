import { NextRequest, NextResponse } from "next/server";
import { getSessionAccountName } from "@/lib/agent-session";
import { getAgentWalletAddress } from "@/lib/agent-payer";
import { getAgentBookStatus } from "@/lib/agentbook";
import {
  getAutoPayLimit,
  HARDCODED_DEFAULT_AUTO_PAY_LIMIT_USDC,
  MIN_AUTO_PAY_LIMIT_USDC,
  MAX_AUTO_PAY_LIMIT_USDC,
  setAutoPayLimit,
} from "@/lib/agent-limits";

export const runtime = "nodejs";

/**
 * Owner-configurable auto-pay threshold for the current session's agent.
 * Only writable when the agent is human-backed (AgentBook).
 */
export async function GET() {
  try {
    const accountName = await getSessionAccountName();
    if (!accountName) {
      return NextResponse.json({
        ok: true,
        needsCreate: true,
        canEdit: false,
        minAutoPayLimitUsdc: MIN_AUTO_PAY_LIMIT_USDC,
        defaultAutoPayLimitUsdc: HARDCODED_DEFAULT_AUTO_PAY_LIMIT_USDC,
        maxAutoPayLimitUsdc: MAX_AUTO_PAY_LIMIT_USDC,
      });
    }

    const address = await getAgentWalletAddress(accountName);
    const [book, limits] = await Promise.all([
      getAgentBookStatus(address),
      getAutoPayLimit(address),
    ]);

    return NextResponse.json({
      ok: true,
      needsCreate: false,
      role: "agent-payer",
      minAutoPayLimitUsdc: MIN_AUTO_PAY_LIMIT_USDC,
      defaultAutoPayLimitUsdc: HARDCODED_DEFAULT_AUTO_PAY_LIMIT_USDC,
      maxAutoPayLimitUsdc: MAX_AUTO_PAY_LIMIT_USDC,
      agentBook: {
        registered: book.registered,
        humanId: book.humanId,
        required: book.required,
      },
      limits,
      canEdit: book.registered || !book.required,
      note: "Spends at or below autoPayLimitUsdc are paid automatically. Above that, human approval is required (HITL).",
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Failed to load limits" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const accountName = await getSessionAccountName();
    if (!accountName) {
      return NextResponse.json(
        {
          ok: false,
          code: "AGENT_NOT_CREATED",
          error: "Creá tu agente antes de configurar el tope.",
        },
        { status: 403 },
      );
    }
    const address = await getAgentWalletAddress(accountName);
    const book = await getAgentBookStatus(address);

    if (book.required && !book.registered) {
      return NextResponse.json(
        {
          ok: false,
          code: "AGENT_NOT_HUMAN_BACKED",
          error: "Register the agent in AgentBook before setting spend limits.",
          registerHint:
            "Use the Register with World App button in the UI (QR on desktop / deep link on mobile).",
        },
        { status: 403 },
      );
    }

    const body = (await request.json().catch(() => ({}))) as {
      autoPayLimitUsdc?: number | string;
    };
    const value = Number(body.autoPayLimitUsdc);
    if (!Number.isFinite(value)) {
      return NextResponse.json(
        { ok: false, error: "autoPayLimitUsdc is required (number)" },
        { status: 400 },
      );
    }

    const limits = await setAutoPayLimit(address, value);
    return NextResponse.json({
      ok: true,
      limits,
      minAutoPayLimitUsdc: MIN_AUTO_PAY_LIMIT_USDC,
      maxAutoPayLimitUsdc: MAX_AUTO_PAY_LIMIT_USDC,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Failed to save limits" },
      { status: 400 },
    );
  }
}
