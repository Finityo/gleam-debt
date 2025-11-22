import { useMemo, useCallback } from "react";
import { useDebtEngine } from "@/engine/DebtEngineContext";

/**
 * Helper hook for pages that already sit under DebtEngineProvider.
 * Keeps usage clean: const { plan, recompute } = useDebtEngineFromStore();
 */
export function useDebtEngineFromStore() {
  const { plan, debtsUsed, settingsUsed } = useDebtEngine();
  
  const recompute = useCallback(() => {
    // DebtEngineContext auto-recomputes when debts/settings change
    // This is a placeholder for manual refresh triggers if needed
    console.log("Plan recompute triggered");
  }, []);
  
  return useMemo(() => ({ plan, debtsUsed, settingsUsed, recompute }), [plan, debtsUsed, settingsUsed, recompute]);
}
