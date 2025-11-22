// ===================================
// src/lib/scenarioCompare.ts
// ===================================
import { computeDebtPlan } from "@/lib/debtPlan";
import type { DebtInput, PlanResult } from "@/lib/debtPlan";
import { computeMinimumOnly } from "@/lib/computeMinimumOnly";

export type ScenarioSettings = {
  strategy?: "snowball" | "avalanche";
  extraMonthly?: number;
  oneTimeExtra?: number;
  startDate?: string;
  maxMonths?: number;
};

export function scenarioCompare(
  debts: DebtInput[],
  settings: ScenarioSettings
): {
  snowball: PlanResult;
  avalanche: PlanResult;
  minimum: PlanResult;
} {
  const snowball = computeDebtPlan({
    debts,
    strategy: "snowball",
    extraMonthly: settings.extraMonthly ?? 0,
    oneTimeExtra: settings.oneTimeExtra ?? 0,
    startDate: settings.startDate,
    maxMonths: settings.maxMonths,
  });

  const avalanche = computeDebtPlan({
    debts,
    strategy: "avalanche",
    extraMonthly: settings.extraMonthly ?? 0,
    oneTimeExtra: settings.oneTimeExtra ?? 0,
    startDate: settings.startDate,
    maxMonths: settings.maxMonths,
  });

  const minimum = computeMinimumOnly(debts);

  return { snowball, avalanche, minimum };
}
