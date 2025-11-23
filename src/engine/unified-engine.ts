// ============================================================================
// FILE: src/engine/unified-engine.ts
// ============================================================================
import type { DebtInput, PlanResult, Strategy } from "@/engine/plan-types";
import { computeDebtPlan } from "@/lib/debtPlan";

export type ComputeUnifiedArgs = {
  debts: DebtInput[];
  strategy: Strategy;
  extraMonthly: number;
  oneTimeExtra: number;
  startDate: string;
  maxMonths?: number;
};

export function computeDebtPlanUnified(args: ComputeUnifiedArgs): PlanResult {
  return computeDebtPlan({
    debts: args.debts,
    strategy: args.strategy,
    extraMonthly: args.extraMonthly,
    oneTimeExtra: args.oneTimeExtra,
    startDate: args.startDate,
    maxMonths: args.maxMonths,
  });
}
