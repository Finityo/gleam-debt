// ============================================================
// src/engine/unified-engine.ts
// Single-point interface for computeDebtPlan()
// Prevents direct calls to older engine version
// ============================================================

import { DebtInput, PlanResult } from "./plan-types";
import { computeDebtPlan } from "@/lib/debtPlan";
import type { Scenario } from "@/types/scenario";

export type ComputeArgs = {
  debts: DebtInput[];
  strategy: Scenario;
  extraMonthly: number;
  oneTimeExtra: number;
  startDate: string;
  maxMonths?: number;
};

export function computeDebtPlanUnified(args: ComputeArgs): PlanResult {
  const plan = computeDebtPlan(args as any);

  // Normalize months to include snowball
  const months = (plan.months ?? []).map((m: any, idx: number) => ({
    ...m,
    snowball: m.snowball ?? m.totals?.outflow ?? 0,
  }));

  return {
    months,
    totals: plan.totals ?? {
      principal: 0,
      interest: 0,
      outflowMonthly: 0,
      monthsToDebtFree: 0,
    },
    debts: args.debts,
    settings: {},
  };
}
