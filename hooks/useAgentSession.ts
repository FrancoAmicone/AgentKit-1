"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import type {
  AgentStatus,
  LimitsResponse,
} from "@/components/AgentStatusBadge";

export type AgentMe = {
  ok: boolean;
  hasAgent?: boolean;
  needsCreate?: boolean;
  accountName?: string;
  address?: string;
  registered?: boolean;
  humanId?: string | null;
  required?: boolean;
  readyToPay?: boolean;
  balances?: {
    usdc: number;
    eth: number;
    funded: boolean;
    minUsdcToFund: number;
  };
  limits?: {
    autoPayLimitUsdc: number;
    source: "default" | "owner";
    updatedAt: string;
  };
  fundHint?: {
    network: string;
    asset: string;
    faucetEth?: string;
    faucetUsdc?: string;
    explorer?: string;
  };
  note?: string;
  error?: string;
  message?: string;
};

/**
 * Per-browser agent session: create CDP wallet, fund, register, tope.
 */
export function useAgentSession() {
  const [me, setMe] = useState<AgentMe | null>(null);
  const [agentStatus, setAgentStatus] = useState<AgentStatus | null>(null);
  const [limitsInfo, setLimitsInfo] = useState<LimitsResponse | null>(null);
  const [limitInput, setLimitInput] = useState("0.1");
  const [savingLimit, setSavingLimit] = useState(false);
  const [limitMessage, setLimitMessage] = useState<string | null>(null);
  const [setupOpen, setSetupOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createMessage, setCreateMessage] = useState<string | null>(null);
  const [refreshingBalances, setRefreshingBalances] = useState(false);

  const applyMe = useCallback((data: AgentMe) => {
    setMe(data);
    if (!data.hasAgent) {
      setAgentStatus({
        ok: true,
        needsCreate: true,
        registered: false,
        required: true,
        note: data.message,
      });
      return;
    }
    setAgentStatus({
      ok: data.ok,
      address: data.address,
      registered: data.registered,
      humanId: data.humanId,
      required: data.required,
      note: data.note,
      needsCreate: false,
      hasAgent: true,
    });
    if (data.limits) {
      setLimitsInfo({
        ok: true,
        canEdit: Boolean(data.registered || !data.required),
        minAutoPayLimitUsdc: 0.01,
        maxAutoPayLimitUsdc: 10_000,
        limits: data.limits,
      });
      setLimitInput(String(data.limits.autoPayLimitUsdc));
    }
  }, []);

  const refreshMe = useCallback(async () => {
    try {
      const res = await fetch("/api/agent/me", {
        signal: AbortSignal.timeout(15_000),
      });
      const data = (await res.json()) as AgentMe;
      applyMe(data);
      return data;
    } catch {
      const failed: AgentMe = {
        ok: false,
        error: "No se pudo leer el agente",
      };
      setMe(failed);
      setAgentStatus({ ok: false, error: failed.error });
      return failed;
    }
  }, [applyMe]);

  const refreshLimits = useCallback(async () => {
    try {
      const res = await fetch("/api/agent/limits");
      const data = (await res.json()) as LimitsResponse;
      setLimitsInfo(data);
      if (data.limits?.autoPayLimitUsdc != null) {
        setLimitInput(String(data.limits.autoPayLimitUsdc));
      }
    } catch {
      setLimitsInfo({ ok: false, error: "No se pudieron cargar los límites" });
    }
  }, []);

  const refreshAll = useCallback(() => {
    void refreshMe().then(() => void refreshLimits());
  }, [refreshMe, refreshLimits]);

  // No auto-open: the header chip and contextual nudges point to Configurar.
  useEffect(() => {
    void (async () => {
      await refreshMe();
      await refreshLimits();
    })();
    // intentionally once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createAgent() {
    setCreating(true);
    setCreateMessage(null);
    try {
      const res = await fetch("/api/agent/create", {
        method: "POST",
        signal: AbortSignal.timeout(25_000),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "No se pudo crear el agente");
      }
      setCreateMessage(data.message || "Agente creado");
      await refreshMe();
      await refreshLimits();
    } catch (err) {
      const timedOut =
        err instanceof Error &&
        (err.name === "TimeoutError" || err.name === "AbortError");
      setCreateMessage(
        timedOut
          ? "Tardó demasiado (¿faltan las keys CDP?). Probá de nuevo."
          : err instanceof Error
            ? err.message
            : "Error al crear agente",
      );
    } finally {
      setCreating(false);
    }
  }

  async function refreshBalances() {
    setRefreshingBalances(true);
    try {
      await refreshMe();
    } finally {
      setRefreshingBalances(false);
    }
  }

  async function onSaveLimit(e: FormEvent) {
    e.preventDefault();
    setSavingLimit(true);
    setLimitMessage(null);
    try {
      const res = await fetch("/api/agent/limits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoPayLimitUsdc: Number(limitInput) }),
      });
      const data = (await res.json()) as LimitsResponse & {
        registerHint?: string;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        throw new Error(
          [data.error, data.registerHint].filter(Boolean).join(" — ") ||
            "No se pudo guardar el límite",
        );
      }
      setLimitsInfo(data);
      if (data.limits?.autoPayLimitUsdc != null) {
        setLimitInput(String(data.limits.autoPayLimitUsdc));
      }
      setLimitMessage(
        `Límite guardado: pago automático hasta $${data.limits?.autoPayLimitUsdc} USDC`,
      );
      await refreshMe();
    } catch (err) {
      setLimitMessage(
        err instanceof Error ? err.message : "Error al guardar límite",
      );
    } finally {
      setSavingLimit(false);
    }
  }

  const canPurchase =
    Boolean(me?.hasAgent) &&
    Boolean(me?.ok) &&
    (!me?.required || me.registered === true) &&
    Boolean(me?.balances?.funded);

  return {
    me,
    agentStatus,
    limitsInfo,
    limitInput,
    setLimitInput,
    savingLimit,
    limitMessage,
    setupOpen,
    setSetupOpen,
    refreshAll,
    onSaveLimit,
    canPurchase,
    autoLimitUsdc: limitsInfo?.limits?.autoPayLimitUsdc ?? me?.limits?.autoPayLimitUsdc,
    minLimitUsdc: limitsInfo?.minAutoPayLimitUsdc ?? 0.01,
    createAgent,
    creating,
    createMessage,
    refreshBalances,
    refreshingBalances,
  };
}
