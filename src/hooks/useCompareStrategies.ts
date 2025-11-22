// ===================================================
// 2. COMPARE STRATEGIES HOOK (Snowball vs Avalanche)
// ===================================================
// FILE: src/hooks/useCompareStrategies.ts

import { useMemo } from "react";
import { useUnifiedPlan } from "@/engine/useUnifiedPlan";
import { computeDebtPlanUnified } from "@/engine/unified-engine";

export function useCompareStrategies() {
  const { debtsUsed, settingsUsed, plan: baseline } = useUnifiedPlan();

  const alternativeStrategy =
    baseline?.strategy === "snowball" ? "avalanche" : "snowball";

  const altPlan = useMemo(() => {
    return computeDebtPlanUnified({
      debts: debtsUsed as any,
      strategy: alternativeStrategy as any,
      extraMonthly: settingsUsed.extraMonthly,
      oneTimeExtra: settingsUsed.oneTimeExtra,
      startDate: settingsUsed.startDate,
      maxMonths: settingsUsed.maxMonths,
    });
  }, [
    debtsUsed,
    settingsUsed.extraMonthly,
    settingsUsed.oneTimeExtra,
    settingsUsed.startDate,
    settingsUsed.maxMonths,
    alternativeStrategy,
  ]);

  return {
    baselinePlan: baseline,
    alternativePlan: altPlan,
    strategyA: baseline?.strategy,
    strategyB: alternativeStrategy,
    monthsSaved:
      (altPlan.totals.monthsToDebtFree ?? altPlan.months.length) -
      (baseline?.totals.monthsToDebtFree ?? baseline?.months.length),
    interestSaved:
      altPlan.totals.interest - (baseline?.totals.interest ?? 0),
  };
}
