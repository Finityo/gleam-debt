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

// APR NORMALIZATION (single source of truth)
// Ensures APR stays a real percent (14.99) even if user imported 0.1499
function normalizeAPR(rawApr: number): number {
  const n = Number(rawApr);
  if (!n || isNaN(n)) return 0;

  // If user typed 0.2499 treat it as 24.99
  if (n < 1) return n * 100;

  // If user typed 24.99 keep it
  return n;
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
