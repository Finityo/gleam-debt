// ⚠️ DEPRECATED — for compatibility only
// All types moved to @/lib/debtPlan
// All logic forwarded to unified engine

import type { DebtInput, PlanResult, Strategy } from "./debtPlan";
export { computeDebtPlan } from "./debtPlan";

// Legacy type aliases for backward compatibility
export type Debt = DebtInput;
export type DebtPlan = PlanResult;
export type Scenario = Strategy | "minimum";
export type UserSettings = {
  strategy?: Strategy;
  extraMonthly?: number;
  oneTimeExtra?: number;
  startDate?: string;
  maxMonths?: number;
};

// Re-export core types
export type { DebtInput, PlanResult, Strategy };
