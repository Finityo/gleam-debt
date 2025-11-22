// ===================================
// src/lib/computeMinimumOnly.ts
// ===================================
import { computeDebtPlan } from "@/lib/debtPlan";
import type { DebtInput, PlanResult } from "@/lib/debtPlan";

/**
 * Compute minimum-only payment plan (no extra payments)
 * This is now a simple wrapper around the main engine
 */
export function computeMinimumOnly(
  inputDebts: DebtInput[],
  opts?: { startDate?: Date; maxMonths?: number }
): PlanResult {
  const startDate = opts?.startDate ?? new Date();
  const maxMonths = opts?.maxMonths ?? 600;
  
  return computeDebtPlan({
    debts: inputDebts,
    strategy: "snowball",
    extraMonthly: 0,
    oneTimeExtra: 0,
    startDate: startDate.toISOString().slice(0, 10),
    maxMonths,
  });
}
