// ---------------------------------------------------------------
// src/engine/usePlanCharts.ts
// Chart / visualization helper hook that reads from useUnifiedPlan.
// NO calls to useNormalizedPlan (to avoid circular dependencies).
// ---------------------------------------------------------------

import { useUnifiedPlan } from "./useUnifiedPlan";

export function usePlanCharts() {
  const unified = useUnifiedPlan();

  return {
    // Pass-through of normalized data for components that already
    // rely on these names.
    plan: unified.plan,
    months: unified.months,
    totals: unified.totals,
    payoffDateISO: unified.payoffDateISO,

    // Chart-specific structures
    lineSeries: unified.lineSeries,
    pieSeries: unified.pieSeries,
    debtPaymentMatrix: unified.debtPaymentMatrix,
    calendarRows: unified.calendarRows,

    // Context / metadata
    debtsUsed: unified.debtsUsed,
    settingsUsed: unified.settingsUsed,

    // Recompute hook
    recompute: unified.recompute,
  };
}
