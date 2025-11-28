// src/engine/useUnifiedPlan.ts
// Unified plan hook – single source of truth for all plan consumers.

import { useMemo } from "react";
import { useDebtEngine, type EngineSettings } from "@/engine/DebtEngineContext";
import type { PlanResult, DebtInput } from "@/engine/plan-types";

export type UnifiedPlanShape = {
  plan: PlanResult | null;
  months: PlanResult["months"];
  totals: PlanResult["totals"];
  orderedDebts: DebtInput[];
  payoffDateISO: string | null;
  lineSeries: any[];
  pieSeries: any[];
  debtPaymentMatrix: any[];
  calendarRows: any[];
  debtsUsed: DebtInput[];
  settingsUsed: EngineSettings | Record<string, any>;
  recompute: () => Promise<void> | void;
};

const EMPTY_TOTALS: PlanResult["totals"] = {
  // keep field names exactly as PlanResult.totals defines them in plan-types
  // these are just safe defaults
  principal: 0,
  interest: 0,
  totalPaid: 0,
  monthsToDebtFree: 0,
  outflowMonthly: 0,
};

export function useUnifiedPlan(): UnifiedPlanShape {
  const live = useDebtEngine();

  return useMemo<UnifiedPlanShape>(() => {
    if (!live || !live.plan) {
      return {
        plan: null,
        months: [],
        totals: EMPTY_TOTALS,
        orderedDebts: [],
        payoffDateISO: null,
        lineSeries: [],
        pieSeries: [],
        debtPaymentMatrix: [],
        calendarRows: [],
        debtsUsed: live?.debtsUsed ?? [],
        settingsUsed: (live?.settingsUsed as EngineSettings) ?? {},
        recompute: live?.recompute ?? (() => {}),
      };
    }

    const { plan, debtsUsed, settingsUsed, recompute } = live;

    // PlanResult coming from computeDebtPlanUnified should already be
    // in the normalized shape the rest of the app expects. We just
    // fan it out into a consistent structure for all consumers.
    return {
      plan,
      months: plan.months ?? [],
      totals: plan.totals ?? EMPTY_TOTALS,
      orderedDebts: (plan as any).orderedDebts ?? debtsUsed ?? [],
      payoffDateISO: (plan as any).startDateISO ?? null,
      lineSeries: (plan as any).lineSeries ?? [],
      pieSeries: (plan as any).pieSeries ?? [],
      debtPaymentMatrix: (plan as any).debtPaymentMatrix ?? [],
      calendarRows: (plan as any).calendarRows ?? [],
      debtsUsed: debtsUsed ?? [],
      settingsUsed: (settingsUsed as EngineSettings) ?? {},
      recompute: recompute ?? (() => {}),
    };
  }, [live]);
}
