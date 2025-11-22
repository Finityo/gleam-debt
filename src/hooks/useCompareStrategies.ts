// ===================================================
// 2. COMPARE STRATEGIES HOOK (Snowball vs Avalanche)
// ===================================================
// FILE: src/hooks/useCompareStrategies.ts

import { useMemo } from "react";
import { useDebtEngineFromStore } from "@/engine/useDebtEngineFromStore";
import { computeDebtPlan } from "@/lib/debtPlan";

export function useCompareStrategies() {
  const { debtsUsed, settingsUsed, plan: baseline } = useDebtEngineFromStore();

  const alternativeStrategy =
    baseline?.strategy === "snowball" ? "avalanche" : "snowball";

  const altPlan = useMemo(() => {
    return computeDebtPlan({
      debts: debtsUsed,
      strategy: alternativeStrategy,
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
