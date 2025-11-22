// ===================================
// src/lib/computeMinimumOnly.ts
// ===================================
import { Debt, DebtPlan, computeDebtPlan } from "@/lib/computeDebtPlan";

/**
 * Compute minimum-only payment plan (no extra payments)
 * This is now a simple wrapper around the main engine
 */
export function computeMinimumOnly(
  inputDebts: Debt[],
  opts?: { startDate?: Date; maxMonths?: number }
): DebtPlan {
  const startDate = opts?.startDate ?? new Date();
  const maxMonths = opts?.maxMonths ?? 600;
  
  return computeDebtPlan(inputDebts, {
    strategy: "snowball",
    extraMonthly: 0,
    oneTimeExtra: 0,
    startDate: startDate.toISOString().slice(0, 10),
    maxMonths,
  });
}
