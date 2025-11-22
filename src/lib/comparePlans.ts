// ===================================
// src/lib/comparePlans.ts
// ===================================
import type { PlanResult } from "@/lib/debtPlan";

export function comparePlans(real: PlanResult, minOnly: PlanResult) {
  const monthsReal = real.totals.monthsToDebtFree ?? real.months.length;
  const monthsMin = minOnly.totals.monthsToDebtFree ?? minOnly.months.length;

  const interestReal = real.totals.interest;
  const interestMin = minOnly.totals.interest;

  return {
    monthsReal,
    monthsMin,
    monthsSaved: monthsMin - monthsReal,

    interestReal,
    interestMin,
    interestSaved: interestMin - interestReal,

    debtFreeDateReal: real.months[real.months.length - 1]?.dateISO ?? real.startDateISO,
    debtFreeDateMin: minOnly.months[minOnly.months.length - 1]?.dateISO ?? minOnly.startDateISO,
  };
}
