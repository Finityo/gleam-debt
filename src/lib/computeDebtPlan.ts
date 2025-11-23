// ============================================================================
// FILE: src/lib/computeDebtPlan.ts - Legacy Compatibility Wrapper
// ============================================================================
import { computeDebtPlan as compute } from "@/lib/debtPlan";
import type { DebtInput, PlanResult as NewPlanResult, Strategy } from "@/engine/plan-types";

// Legacy type exports for backward compatibility
export type Debt = DebtInput;
export type Scenario = Strategy | "minimum";
export type UserSettings = {
  strategy?: Strategy;
  extraMonthly?: number;
  oneTimeExtra?: number;
  startDate?: string;
  maxMonths?: number;
};

export type DebtPlan = NewPlanResult;
export type PlanResult = NewPlanResult;
export type { DebtInput, Strategy };

// Legacy function signature (2 params)
export function computeDebtPlan(
  debts: DebtInput[],
  settings?: UserSettings
): PlanResult {
  return compute({
    debts,
    strategy: settings?.strategy ?? "snowball",
    extraMonthly: settings?.extraMonthly ?? 0,
    oneTimeExtra: settings?.oneTimeExtra ?? 0,
    startDate: settings?.startDate ?? new Date().toISOString().slice(0, 10),
    maxMonths: settings?.maxMonths,
  });
}
