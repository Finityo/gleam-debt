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

// APR NORMALIZATION (bulletproof)
// Ensures APR stays a real percent (14.99) even if user imported 0.1499
function normalizeAPR(rawApr: number): number {
  if (!rawApr || isNaN(rawApr)) return 0;
  return rawApr > 1 ? rawApr : rawApr * 100;
}

export function computeDebtPlanUnified(args: ComputeUnifiedArgs): PlanResult {
  const normalizedDebts = args.debts.map(d => ({
    ...d,
    apr: normalizeAPR(Number(d.apr)),
  }));

  return computeDebtPlan({
    debts: normalizedDebts,
    strategy: args.strategy,
    extraMonthly: args.extraMonthly,
    oneTimeExtra: args.oneTimeExtra,
    startDate: args.startDate,
    maxMonths: args.maxMonths,
  });
}
