// ===================================
// src/lib/scenarioCompare.ts
// ===================================
import { computeDebtPlanUnified } from "@/engine/unified-engine";
import type { DebtInput, PlanResult } from "@/engine/plan-types";
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
  const snowball = computeDebtPlanUnified({
    debts,
    strategy: "snowball",
    extraMonthly: settings.extraMonthly ?? 0,
    oneTimeExtra: settings.oneTimeExtra ?? 0,
    startDate: settings.startDate ?? new Date().toISOString().slice(0, 10),
    maxMonths: settings.maxMonths,
  });

  const avalanche = computeDebtPlanUnified({
    debts,
    strategy: "avalanche",
    extraMonthly: settings.extraMonthly ?? 0,
    oneTimeExtra: settings.oneTimeExtra ?? 0,
    startDate: settings.startDate ?? new Date().toISOString().slice(0, 10),
    maxMonths: settings.maxMonths,
  });

  const minimum = computeMinimumOnly(debts);

  return { snowball, avalanche, minimum };
}
