export type PlanTier = "free" | "essentials" | "ultimate";

export const PLAN_LABELS: Record<PlanTier, string> = {
  free: "Free",
  essentials: "Essentials",
  ultimate: "Ultimate"
};

export const PLAN_FEATURES = {
  free: {
    canUseWhatIf: false,
    canUseCoach: false,
    canSeePaceMonitor: false,
    canSeeHeatmap: false,
    canSetGoals: true,
    canSeeMilestones: true,
    canSeeInsights: false
  },
  essentials: {
    canUseWhatIf: true,
    canUseCoach: false,
    canSeePaceMonitor: true,
    canSeeHeatmap: true,
    canSetGoals: true,
    canSeeMilestones: true,
    canSeeInsights: true
  },
  ultimate: {
    canUseWhatIf: true,
    canUseCoach: true,
    canSeePaceMonitor: true,
    canSeeHeatmap: true,
    canSetGoals: true,
    canSeeMilestones: true,
    canSeeInsights: true
  }
} as const;
