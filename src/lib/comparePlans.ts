// ===================================
// src/lib/comparePlans.ts
// ===================================
import { DebtPlan } from "@/lib/computeDebtPlan";

export function comparePlans(real: DebtPlan, minOnly: DebtPlan) {
  const monthsReal = real.summary.finalMonthIndex + 1;
  const monthsMin = minOnly.summary.finalMonthIndex + 1;

  const interestReal = real.totalInterest;
  const interestMin = minOnly.totalInterest;

  return {
    monthsReal,
    monthsMin,
    monthsSaved: monthsMin - monthsReal,

    interestReal,
    interestMin,
    interestSaved: interestMin - interestReal,

    debtFreeDateReal: real.debtFreeDate,
    debtFreeDateMin: minOnly.debtFreeDate,
  };
}
