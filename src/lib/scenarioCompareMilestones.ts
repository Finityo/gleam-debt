// ===================================
// src/lib/scenarioCompareMilestones.ts
// ===================================
import { Debt, UserSettings } from "@/lib/computeDebtPlan";
import { scenarioCompare } from "@/lib/scenarioCompare";
import { getMilestones } from "@/lib/milestones";

export function scenarioCompareWithMilestones(
  debts: Debt[],
  settings: UserSettings
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
