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

// Helper to compute calendar rows from months
function computeCalendarRows(months: PlanResult["months"], debts: DebtInput[]) {
  return months.map(m => ({
    monthIndex: m.monthIndex,
    dateISO: m.dateISO,
    outflow: m.totals.outflow,
    interest: m.totals.interest,
    principal: m.totals.principal,
    paidOffDebts: m.payments
      .filter(p => p.isClosed || p.closedThisMonth || p.endingBalance <= 0.01)
      .map(p => p.debtId),
  }));
}

// Helper to compute debt payment matrix
function computeDebtPaymentMatrix(months: PlanResult["months"], debts: DebtInput[]) {
  const matrix: any[] = [];
  debts.forEach(debt => {
    const row: any = { debtId: debt.id, debtName: debt.name, payments: [] };
    months.forEach(m => {
      const payment = m.payments.find(p => p.debtId === debt.id);
      row.payments.push({
        monthIndex: m.monthIndex,
        totalPaid: payment?.totalPaid || 0,
        principal: payment?.principal || 0,
        interest: payment?.interest || 0,
        endingBalance: payment?.endingBalance || 0,
      });
    });
    matrix.push(row);
  });
  return matrix;
}

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

    // CRITICAL FIX: Compute derived chart/calendar structures that were missing
    const months = plan.months ?? [];
    const calendarRows = computeCalendarRows(months, debtsUsed ?? []);
    const debtPaymentMatrix = computeDebtPaymentMatrix(months, debtsUsed ?? []);
    
    // Compute line series for charts (month-by-month remaining balance)
    const lineSeries = months.map(m => ({
      month: m.monthIndex,
      remaining: m.payments.reduce((sum, p) => sum + (p.endingBalance || 0), 0),
    }));

    // Compute pie series (current balance distribution)
    const totalBalance = (debtsUsed ?? []).reduce((sum, d) => sum + d.balance, 0);
    const pieSeries = totalBalance > 0
      ? (debtsUsed ?? []).map(d => ({
          name: d.name,
          value: (d.balance / totalBalance) * 100,
        }))
      : [];

    return {
      plan,
      months,
      totals: plan.totals ?? EMPTY_TOTALS,
      orderedDebts: plan.debts ?? debtsUsed ?? [],
      payoffDateISO: plan.startDateISO ?? null,
      lineSeries,
      pieSeries,
      debtPaymentMatrix,
      calendarRows,
      debtsUsed: debtsUsed ?? [],
      settingsUsed: (settingsUsed as EngineSettings) ?? {},
      recompute: recompute ?? (() => {}),
    };
  }, [live]);
}
