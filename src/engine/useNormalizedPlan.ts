// ---------------------------------------------------------------
// src/engine/useNormalizedPlan.ts
// Legacy alias – everything reads the same unified shape.
// ---------------------------------------------------------------

import { useUnifiedPlan } from "./useUnifiedPlan";

/**
 * Legacy hook kept for compatibility.
 * Internally it just returns the unified plan shape.
 */
export function useNormalizedPlan() {
  return useUnifiedPlan();
}

export default useNormalizedPlan;
