/** Shared import so hover-preload and next/dynamic hit the same chunk. */
export function loadAgentDashboard() {
  return import("@/components/AgentDashboard");
}

export function preloadAgentDashboard() {
  if (typeof window === "undefined") return;
  void loadAgentDashboard();
}
