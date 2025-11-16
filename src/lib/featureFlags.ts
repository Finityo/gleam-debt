import type { PlanTier } from "./planTypes";
import { PLAN_FEATURES } from "./planTypes";

export type FeatureKey =
  | "canUseWhatIf"
  | "canUseCoach"
  | "canSeePaceMonitor"
  | "canSeeHeatmap"
  | "canSetGoals"
  | "canSeeMilestones"
  | "canSeeInsights";

export function canUseFeature(plan: PlanTier | null | undefined, feature: FeatureKey) {
  const tier = plan ?? "free";
  return PLAN_FEATURES[tier][feature];
}
