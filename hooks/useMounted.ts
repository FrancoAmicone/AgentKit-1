"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/** True only on the client — safe for portals / window APIs (SSR-safe). */
export function useMounted() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}
