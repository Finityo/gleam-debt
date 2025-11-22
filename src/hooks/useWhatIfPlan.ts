// ===============================================
// 3. WHAT-IF CALCULATOR (Dynamic Live Overrides)
// ===============================================
// FILE: src/hooks/useWhatIfPlan.ts

import { useMemo, useState } from "react";
import { useUnifiedPlan } from "@/engine/useUnifiedPlan";
import { computeDebtPlan } from "@/lib/debtPlan";

export function useWhatIfPlan() {
  const { debtsUsed, settingsUsed, plan: baselinePlan } =
    useUnifiedPlan();

  const [whatIf, setWhatIf] = useState({
    extraMonthly: settingsUsed.extraMonthly,
    oneTimeExtra: settingsUsed.oneTimeExtra,
    strategy: settingsUsed.strategy,
  });

  const whatIfPlan = useMemo(() => {
    return computeDebtPlan({
      debts: debtsUsed as any,
      strategy: whatIf.strategy,
      extraMonthly: Number(whatIf.extraMonthly),
      oneTimeExtra: Number(whatIf.oneTimeExtra),
      startDate: settingsUsed.startDate,
      maxMonths: settingsUsed.maxMonths,
    });
  }, [
    debtsUsed,
    whatIf.strategy,
    whatIf.extraMonthly,
    whatIf.oneTimeExtra,
    settingsUsed.startDate,
    settingsUsed.maxMonths,
  ]);

  return {
    baselinePlan,
    whatIfPlan,
    whatIf,
    setWhatIf,
    monthsDelta:
      (whatIfPlan.totals.monthsToDebtFree ?? whatIfPlan.months.length) -
      (baselinePlan?.totals.monthsToDebtFree ?? baselinePlan?.months.length),
    interestDelta:
      whatIfPlan.totals.interest -
      (baselinePlan?.totals.interest ?? 0),
  };
}
