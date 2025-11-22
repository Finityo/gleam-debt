// =============================================
// 1. COMPATIBILITY WRAPPER – SAFE + DEPRECATED
// =============================================
// FILE: src/lib/computeDebtPlan.ts
// (Keeps old imports working but always calls new engine)

import {
  computeDebtPlan as computeNew,
  type DebtInput,
  type Strategy,
  type PlanResult,
} from "@/lib/debtPlan";

/** 
 * @deprecated  ⚠️
 * Use `computeDebtPlan` from "@/lib/debtPlan" instead.
 * This wrapper is ONLY here to prevent breaking older components.
 */

// Re-export types for backward compatibility
export type Debt = DebtInput;
export type DebtPlan = PlanResult;
export type Scenario = "snowball" | "avalanche" | "minimum";
export { Strategy };

export type UserSettings = {
  strategy?: Strategy;
  extraMonthly?: number;
  oneTimeExtra?: number;
  startDate?: string;
  maxMonths?: number;
};

export type ComputeDebtPlanSettings = UserSettings;

export function computeDebtPlan(
  debts: DebtInput[],
  settings: ComputeDebtPlanSettings = {}
): PlanResult {
  return computeNew({
    debts,
    strategy: settings.strategy || "snowball",
    extraMonthly: settings.extraMonthly || 0,
    oneTimeExtra: settings.oneTimeExtra || 0,
    startDate: settings.startDate,
    maxMonths: settings.maxMonths,
  });
}
