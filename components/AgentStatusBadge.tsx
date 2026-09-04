export type AgentStatus = {
  ok: boolean;
  address?: string;
  registered?: boolean;
  humanId?: string | null;
  required?: boolean;
  registerHint?: string;
  note?: string;
  error?: string;
  needsCreate?: boolean;
  hasAgent?: boolean;
};

export type LimitsResponse = {
  ok: boolean;
  canEdit?: boolean;
  needsCreate?: boolean;
  minAutoPayLimitUsdc?: number;
  maxAutoPayLimitUsdc?: number;
  limits?: {
    autoPayLimitUsdc: number;
    source: "default" | "owner";
    updatedAt: string;
  };
  error?: string;
};

export function StatusBadge({
  status,
  className = "",
}: {
  status: AgentStatus | null;
  className?: string;
}) {
  const base =
    "inline-flex rounded-sm px-2 py-0.5 text-[11px] font-semibold " + className;
  if (!status) {
    return (
      <span className={`${base} bg-white/5 text-[var(--muted)]`}>Checando…</span>
    );
  }
  if (status.needsCreate) {
    return (
      <span className={`${base} bg-[var(--clay)]/15 text-[var(--clay)]`}>
        Sin agente
      </span>
    );
  }
  if (!status.ok) {
    return (
      <span className={`${base} bg-[var(--danger)]/10 text-[var(--danger)]`}>
        Error
      </span>
    );
  }
  if (!status.required) {
    return (
      <span className={`${base} bg-white/5 text-[var(--muted)]`}>Gate off</span>
    );
  }
  if (status.registered) {
    return (
      <span className={`${base} bg-[var(--pine)]/15 text-[var(--pine)]`}>
        Human-backed
      </span>
    );
  }
  return (
    <span className={`${base} bg-[var(--clay)]/15 text-[var(--clay)]`}>
      Sin World
    </span>
  );
}
