import { useMemo } from "react";
import { useNormalizedPlan } from "@/engine/useNormalizedPlan";

/** small utility */
const toNum = (v: any, def = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
};

/**
 * usePlanCharts
 * Central chart prep from normalized months/debts.
 * Any page needing chart or calendar data uses this instead of rolling its own.
 */
export function usePlanCharts() {
  const {
    plan,
    months,
    totals,
    orderedDebts,
    payoffDateISO,
    debtsUsed,
    settingsUsed,
    recompute,
  } = useNormalizedPlan();

  // Line chart: remaining balance by month
  const lineSeries = useMemo(() => {
    return (months ?? []).map((m: any, idx: number) => {
      const payments = m.payments ?? [];
      const remainingBalance = payments.reduce(
        (sum: number, p: any) => sum + toNum(p.endingBalance),
        0
      );
      const principal = toNum(m.totals?.principal);
      const interest = toNum(m.totals?.interest);
      const outflow = toNum(m.totals?.outflow);
      return {
        x: m.monthIndex ?? idx + 1,
        dateISO: m.dateISO ?? null,
        principal,
        interest,
        outflow,
        totalPaid: principal + interest,
        remainingBalance,
      };
    });
  }, [months]);

  // Per-debt stacked bars / tables
  const debtPaymentMatrix = useMemo(() => {
    if (!months?.length) return [];
    return months.map((m: any, idx: number) => ({
      monthIndex: m.monthIndex ?? idx + 1,
      dateISO: m.dateISO ?? null,
      payments: (m.payments ?? []).map((p: any) => ({
        debtId: p.debtId,
        totalPaid: toNum(p.totalPaid),
        principal: toNum(p.principal),
        interest: toNum(p.interest),
        endingBalance: toNum(p.endingBalance),
        isClosed: toNum(p.endingBalance) <= 0.01,
      })),
    }));
  }, [months]);

  // Pie chart: total paid by debt
  const pieSeries = useMemo(() => {
    const totalsByDebt: Record<string, number> = {};
    debtPaymentMatrix.forEach((row: any) => {
      row.payments.forEach((p: any) => {
        totalsByDebt[p.debtId] =
          (totalsByDebt[p.debtId] || 0) + toNum(p.totalPaid);
      });
    });

    return orderedDebts.map((d: any) => ({
      debtId: d.id ?? d.debtId,
      label: d.name || `Debt ${d.order ?? ""}`.trim(),
      value: totalsByDebt[d.id ?? d.debtId] || 0,
    }));
  }, [debtPaymentMatrix, orderedDebts]);

  // Calendar rows: month summary + paid-off debts
  const calendarRows = useMemo(() => {
    return (months ?? []).map((m: any, idx: number) => {
      const paidOff = (m.payments ?? []).filter(
        (p: any) =>
          toNum(p.endingBalance) <= 0.01 && toNum(p.totalPaid) > 0
      );
      return {
        monthIndex: m.monthIndex ?? idx + 1,
        dateISO: m.dateISO ?? null,
        totalPaid: toNum(m.totals?.principal) + toNum(m.totals?.interest),
        principal: toNum(m.totals?.principal),
        interest: toNum(m.totals?.interest),
        outflow: toNum(m.totals?.outflow),
        snowball: toNum(m.snowball ?? m.totals?.outflow),
        paidOffDebts: paidOff.map((p: any) => p.debtId),
      };
    });
  }, [months]);

  return {
    plan,
    months,
    totals,
    orderedDebts,
    payoffDateISO,
    lineSeries,
    pieSeries,
    debtPaymentMatrix,
    calendarRows,
    debtsUsed,
    settingsUsed,
    recompute,
  };
}
