import { useMemo } from "react";
import { useDebtEngine } from "@/engine/DebtEngineContext";
import { toNum } from "@/engine/plan-helpers";

/**
 * useUnifiedPlan
 * Provides normalized plan data from the engine context.
 * This is the base hook - all other plan hooks should call this.
 */
export function useUnifiedPlan() {
  const live = useDebtEngine();

  // Normalize live engine data
  return useMemo(() => {
    if (!live.plan) return null;

    const months = (live.plan.months ?? []).map((m: any, idx: number) => ({
      monthIndex: toNum(m.monthIndex, idx + 1),
      dateISO: m.dateISO ?? null,
      totals: {
        outflow: toNum(m.totals?.outflow),
        principal: toNum(m.totals?.principal),
        interest: toNum(m.totals?.interest),
      },
      snowball: toNum(m.snowball ?? m.totals?.outflow),
      payments: (m.payments ?? []).map((p: any) => ({
        debtId: p.debtId,
        totalPaid: toNum(p.totalPaid),
        principal: toNum(p.principal),
        interest: toNum(p.interest),
        endingBalance: toNum(p.endingBalance),
        isClosed: toNum(p.endingBalance) <= 0.01,
      })),
    }));

    const totals = {
      principal: toNum(live.plan.totals?.principal),
      interest: toNum(live.plan.totals?.interest),
      outflowMonthly: toNum(live.plan.totals?.outflowMonthly),
      monthsToDebtFree: toNum(live.plan.totals?.monthsToDebtFree, months.length),
    };

    const orderedDebts = [...(live.plan.debts ?? live.debtsUsed ?? [])].sort(
      (a: any, b: any) => (a.order ?? 0) - (b.order ?? 0)
    );

    const payoffDateISO = months.length
      ? months[months.length - 1]?.dateISO ?? null
      : null;

    // Build chart data from live
    const lineSeries = months.map((m: any) => ({
      x: m.monthIndex,
      dateISO: m.dateISO,
      principal: m.totals.principal,
      interest: m.totals.interest,
      outflow: m.totals.outflow,
      totalPaid: m.totals.principal + m.totals.interest,
      remainingBalance: (m.payments ?? []).reduce(
        (sum: number, p: any) => sum + toNum(p.endingBalance),
        0
      ),
    }));

    const debtPaymentMatrix = months.map((m: any) => ({
      monthIndex: m.monthIndex,
      dateISO: m.dateISO,
      payments: m.payments ?? [],
    }));

    const totalsByDebt: Record<string, number> = {};
    debtPaymentMatrix.forEach((row: any) => {
      row.payments.forEach((p: any) => {
        totalsByDebt[p.debtId] =
          (totalsByDebt[p.debtId] || 0) + toNum(p.totalPaid);
      });
    });

    const pieSeries = orderedDebts.map((d: any) => ({
      debtId: d.id ?? d.debtId,
      label: d.name || `Debt ${d.order ?? ""}`.trim(),
      value: totalsByDebt[d.id ?? d.debtId] || 0,
    }));

    const calendarRows = months.map((m: any) => {
      const paidOff = (m.payments ?? []).filter(
        (p: any) =>
          toNum(p.endingBalance) <= 0.01 && toNum(p.totalPaid) > 0
      );
      return {
        monthIndex: m.monthIndex,
        dateISO: m.dateISO,
        totalPaid: m.totals.principal + m.totals.interest,
        principal: m.totals.principal,
        interest: m.totals.interest,
        outflow: m.totals.outflow,
        snowball: m.snowball ?? m.totals.outflow,
        paidOffDebts: paidOff.map((p: any) => p.debtId),
      };
    });

    return {
      plan: live.plan,
      months,
      totals,
      orderedDebts,
      payoffDateISO,
      lineSeries,
      pieSeries,
      debtPaymentMatrix,
      calendarRows,
      debtsUsed: live.debtsUsed,
      settingsUsed: live.settingsUsed,
      recompute: live.recompute,
    };
  }, [live]);
}
