import { useMemo } from "react";
import { useDebtEngine } from "@/engine/DebtEngineContext";

/**
 * Helper hook for pages that already sit under DebtEngineProvider.
 * Keeps usage clean: const { plan } = useDebtEngineFromStore();
 */
export function useDebtEngineFromStore() {
  const { plan, debtsUsed, settingsUsed } = useDebtEngine();
  return useMemo(() => ({ plan, debtsUsed, settingsUsed }), [plan, debtsUsed, settingsUsed]);
}
