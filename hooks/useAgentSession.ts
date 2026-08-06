"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import type {
  AgentStatus,
  LimitsResponse,
} from "@/components/AgentSetupModal";

/**
 * Agent status, auto-pay limits, and setup modal state.
 * Shared demo wallet — not multi-user (see docs/11-demo-tradeoffs.md).
 */
export function useAgentSession() {
  const [agentStatus, setAgentStatus] = useState<AgentStatus | null>(null);
  const [limitsInfo, setLimitsInfo] = useState<LimitsResponse | null>(null);
  const [limitInput, setLimitInput] = useState("0.1");
  const [savingLimit, setSavingLimit] = useState(false);
  const [limitMessage, setLimitMessage] = useState<string | null>(null);
  const [setupOpen, setSetupOpen] = useState(false);
  const autoOpenedSetupRef = useRef(false);

  const applyAgentStatus = useCallback((data: AgentStatus) => {
    setAgentStatus(data);
    // Open Configurar once when gate requires registration (from fetch, not an effect).
    if (
      !autoOpenedSetupRef.current &&
      data.ok &&
      data.required &&
      data.registered !== true
    ) {
      autoOpenedSetupRef.current = true;
      setSetupOpen(true);
    }
  }, []);

  const refreshAgentStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/agent/status");
      const data = (await res.json()) as AgentStatus;
      applyAgentStatus(data);
    } catch {
      setAgentStatus({
        ok: false,
        error: "No se pudo leer el status del agente",
      });
    }
  }, [applyAgentStatus]);

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
    void refreshAgentStatus();
    void refreshLimits();
  }, [refreshAgentStatus, refreshLimits]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [statusRes, limitsRes] = await Promise.all([
          fetch("/api/agent/status"),
          fetch("/api/agent/limits"),
        ]);
        const status = (await statusRes.json()) as AgentStatus;
        const limits = (await limitsRes.json()) as LimitsResponse;
        if (cancelled) return;
        applyAgentStatus(status);
        setLimitsInfo(limits);
        if (limits.limits?.autoPayLimitUsdc != null) {
          setLimitInput(String(limits.limits.autoPayLimitUsdc));
        }
      } catch {
        if (cancelled) return;
        setAgentStatus({
          ok: false,
          error: "No se pudo leer el status del agente",
        });
        setLimitsInfo({ ok: false, error: "No se pudieron cargar los límites" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applyAgentStatus]);

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
    } catch (err) {
      setLimitMessage(
        err instanceof Error ? err.message : "Error al guardar límite",
      );
    } finally {
      setSavingLimit(false);
    }
  }

  const canPurchase =
    Boolean(agentStatus?.ok) &&
    (!agentStatus?.required || agentStatus.registered === true);

  return {
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
    autoLimitUsdc: limitsInfo?.limits?.autoPayLimitUsdc,
    minLimitUsdc: limitsInfo?.minAutoPayLimitUsdc ?? 0.01,
  };
}
