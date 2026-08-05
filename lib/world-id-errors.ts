/** Map raw World / fetch errors to short Spanish UI copy. */
export function formatWorldIdError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  if (raw === "Load failed" || /failed to fetch|networkerror/i.test(raw)) {
    return "Falló la conexión con World. Reintentá y abrí World App una sola vez (o escaneá el QR).";
  }
  if (raw.includes("connection_failed")) {
    return "Se cortó la conexión con World Bridge. Volvé a intentar y abrí World App una sola vez.";
  }
  return raw;
}
