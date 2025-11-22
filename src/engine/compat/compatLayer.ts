// COMPATIBILITY ENGINE LAYER
// Wraps the new engine and emits old engine shapes

import {
  computeDebtPlan as computeNew,
  type DebtInput,
  type PlanResult as NewPlanResult,
  type Strategy,
} from "@/lib/debtPlan";

import {
  type LegacyPayment,
  type LegacyMonth,
  type LegacyDebtPlan,
} from "./legacyTypes";

export type ComputeDebtPlanSettings = {
  strategy?: Strategy;
  extraMonthly?: number;
  oneTimeExtra?: number;
  startDate?: string;
  maxMonths?: number;
};

// Convert the new engine output into old engine shapes
function addCompatibilityProps(result: NewPlanResult): LegacyDebtPlan {
  const finalMonth = result.months[result.months.length - 1];

  const months: LegacyMonth[] = result.months.map((m) => ({
    payments: m.payments.map((p): LegacyPayment => ({
      ...p,

      // old names
      paid: p.totalPaid,
      interest: p.interestAccrued,
      principal: p.totalPaid - p.interestAccrued,
      balanceEnd: p.endingBalance,

      // retention
      totalPaid: p.totalPaid,
      interestAccrued: p.interestAccrued,
      endingBalance: p.endingBalance,
    })),

    totalPaid: m.totals.outflow,
    totalInterest: m.totals.interest,
    snowballPoolApplied: m.totals.outflow,
  }));

  return {
    ...result,
    months,

    // old-style summaries
    debtFreeDate: finalMonth ? finalMonth.dateISO : result.startDateISO,
    totalInterest: result.totals.interest,
    totalPaid: result.totals.totalPaid,

    summary: {
      firstDebtPaidMonth: null,
      initialOutflow: result.totals.outflowMonthly,
      finalMonthIndex: result.months.length - 1,
    },
  };
}

/**
 * DEPRECATED WRAPPER:
 * Converts new engine → legacy engine shape
 */
export function computeDebtPlan(
  debts: DebtInput[],
  settings: ComputeDebtPlanSettings = {}
): LegacyDebtPlan {
  const res = computeNew({
    debts,
    strategy: settings.strategy || "snowball",
    extraMonthly: settings.extraMonthly || 0,
    oneTimeExtra: settings.oneTimeExtra || 0,
    startDate: settings.startDate,
    maxMonths: settings.maxMonths,
  });

  return addCompatibilityProps(res);
}
