// Shared plan types for the unified engine
// These are thin re-exports of the canonical types defined in `@/lib/debtPlan`.
// Keeping this file small and focused avoids drift between the engine and the
// core planner implementation.

import type { DebtInput, PlanMonth, PlanResult, Strategy, PlanPayment, PlanTotals } from "@/lib/debtPlan";

// Re-export the core types so everything can import from `@/engine/plan-types`.
export type { DebtInput, PlanMonth, PlanResult, Strategy };

// Convenience alias: a single payment row inside a month.
export type { PlanPayment };

// Convenience alias: aggregate totals for the entire plan.
export type { PlanTotals };
