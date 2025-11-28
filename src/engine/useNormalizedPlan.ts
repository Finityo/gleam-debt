import { useUnifiedPlan } from "./useUnifiedPlan";

/**
 * Legacy compatibility hook.
 *
 * Historically, useNormalizedPlan did some extra shaping and
 * sometimes called other hooks. That created a circular dependency
 * with usePlanCharts.
 *
 * Now it is a thin alias over useUnifiedPlan so:
 * - All math comes from the unified engine
 * - No circular hook calls
 */
export function useNormalizedPlan() {
  return useUnifiedPlan();
}

export default useNormalizedPlan;
