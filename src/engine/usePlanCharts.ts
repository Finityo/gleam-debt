import { useUnifiedPlan } from "./useUnifiedPlan";

/**
 * Chart-facing hook.
 *
 * For now, this simply exposes the unified plan output.
 * If we want custom line/pie series later, we can derive them
 * here from `months`, `totals`, or `orderedDebts` WITHOUT
 * calling any other engine hooks.
 *
 * This guarantees:
 * - No recursion with useNormalizedPlan
 * - A single source of truth in useUnifiedPlan
 */
export function usePlanCharts() {
  return useUnifiedPlan();
}

export default usePlanCharts;
