// ===================================
// src/lib/scenarioCompareMilestones.ts
// ===================================
import type { DebtInput } from "@/lib/debtPlan";
import { scenarioCompare, type ScenarioSettings } from "@/lib/scenarioCompare";
import { getMilestones } from "@/lib/milestones";

export function scenarioCompareWithMilestones(
  debts: DebtInput[],
  settings: ScenarioSettings
) {
  const { snowball, avalanche, minimum } = scenarioCompare(debts, settings);

  return {
    snowball,
    avalanche,
    minimum,
    milestones: {
      snowball: getMilestones(snowball),
      avalanche: getMilestones(avalanche),
      minimum: [], // minimum only usually has no/internal milestones
    },
  };
}
