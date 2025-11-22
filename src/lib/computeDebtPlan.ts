// =============================================
// COMPATIBILITY WRAPPER – SAFE + DEPRECATED
// =============================================
// FILE: src/lib/computeDebtPlan.ts
// (Keeps old imports working but always calls new engine)

import {
  computeDebtPlan as computeNew,
  type DebtInput,
  type Strategy,
  type PlanResult as NewPlanResult,
  type PlanMonth as NewPlanMonth,
  type DebtMonthPayment as NewDebtMonthPayment,
} from "@/lib/debtPlan";

/** 
 * @deprecated  ⚠️
 * Use types from "@/lib/debtPlan" instead.
 * These wrappers provide backward compatibility.
 */

// Re-export base types
export type Debt = DebtInput;
export type Scenario = "snowball" | "avalanche" | "minimum";
export { Strategy, type DebtInput };

// Extended types for backward compatibility
export interface DebtMonthPayment extends NewDebtMonthPayment {
  // Add old property names as aliases
  paid?: number;
  interest?: number;
  principal?: number;
  balanceEnd?: number;
}

export interface PlanMonth extends Omit<NewPlanMonth, 'payments'> {
  payments: DebtMonthPayment[];
  // Add old property names
  totalPaid?: number;
  totalInterest?: number;
  snowballPoolApplied?: number;
}

export interface DebtPlan extends Omit<NewPlanResult, 'months'> {
  months: PlanMonth[];
  // Add old property names
  debtFreeDate?: string;
  totalInterest?: number;
  totalPaid?: number;
  summary?: {
    firstDebtPaidMonth: number | null;
    initialOutflow: number;
    finalMonthIndex: number;
  };
}

export type PlanResult = DebtPlan;

export type UserSettings = {
  strategy?: Strategy;
  extraMonthly?: number;
  oneTimeExtra?: number;
  startDate?: string;
  maxMonths?: number;
};

export type ComputeDebtPlanSettings = UserSettings;

// Transform function to add compatibility properties
function addCompatibilityProps(result: NewPlanResult): DebtPlan {
  const lastMonth = result.months[result.months.length - 1];
  
  return {
    ...result,
    months: result.months.map((m): PlanMonth => ({
      ...m,
      payments: m.payments.map((p): DebtMonthPayment => ({
        ...p,
        paid: p.totalPaid,
        interest: p.interestAccrued,
        principal: p.totalPaid - p.interestAccrued,
        balanceEnd: p.endingBalance,
      })),
      totalPaid: m.totals.outflow,
      totalInterest: m.totals.interest,
      snowballPoolApplied: m.totals.outflow,
    })),
    debtFreeDate: lastMonth ? lastMonth.dateISO : result.startDateISO,
    totalInterest: result.totals.interest,
    totalPaid: result.totals.totalPaid,
    summary: {
      firstDebtPaidMonth: null,
      initialOutflow: result.totals.outflowMonthly,
      finalMonthIndex: result.months.length - 1,
    },
  };
}

export function computeDebtPlan(
  debts: DebtInput[],
  settings: ComputeDebtPlanSettings = {}
): DebtPlan {
  const result = computeNew({
    debts,
    strategy: settings.strategy || "snowball",
    extraMonthly: settings.extraMonthly || 0,
    oneTimeExtra: settings.oneTimeExtra || 0,
    startDate: settings.startDate,
    maxMonths: settings.maxMonths,
  });
  
  return addCompatibilityProps(result);
}
