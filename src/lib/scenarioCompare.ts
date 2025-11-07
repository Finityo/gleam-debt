// ===================================
// src/lib/scenarioCompare.ts
// ===================================
import { Debt, UserSettings, DebtPlan, computeDebtPlan } from "@/lib/computeDebtPlan";
import { computeMinimumOnly } from "@/lib/computeMinimumOnly";

export function scenarioCompare(
  debts: Debt[],
  settings: UserSettings
): {
  snowball: DebtPlan;
  avalanche: DebtPlan;
  minimum: DebtPlan;
} {
  const snowball = computeDebtPlan(debts, {
    ...settings,
    strategy: "snowball",
  });

  const avalanche = computeDebtPlan(debts, {
    ...settings,
    strategy: "avalanche",
  });

  const minimum = computeMinimumOnly(debts);

  return { snowball, avalanche, minimum };
}
