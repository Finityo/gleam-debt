import { useMemo } from "react";
import { useNormalizedPlan } from "@/engine/useNormalizedPlan";

/**
 * usePlanCharts (Military mode)
 * Centralized chart prep with hardened guards.
 */
export function usePlanCharts() {
  const { plan, months, totals, orderedDebts, payoffDateISO, debtsUsed, settingsUsed, recompute } = useNormalizedPlan();

  const lineSeries = useMemo(() => {
    return (months ?? []).map((m: any, idx: number) => {
      const payments = m.payments ?? [];
      const remainingBalance = payments.reduce((sum: number, p: any) => sum + (Number(p.endingBalance ?? 0) || 0), 0);
      const principal = Number(m.totals?.principal ?? 0) || 0;
      const interest = Number(m.totals?.interest ?? 0) || 0;
      const outflow = Number(m.totals?.outflow ?? 0) || 0;
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

  const debtPaymentMatrix = useMemo(() => {
    if (!months?.length) return [];
    return months.map((m: any, idx: number) => ({
      monthIndex: m.monthIndex ?? idx + 1,
      dateISO: m.dateISO ?? null,
      payments: (m.payments ?? []).map((p: any) => ({
        debtId: p.debtId,
        totalPaid: Number(p.totalPaid ?? 0) || 0,
        principal: Number(p.principal ?? 0) || 0,
        interest: Number(p.interest ?? 0) || 0,
        endingBalance: Number(p.endingBalance ?? 0) || 0,
        isClosed: Number(p.endingBalance ?? 0) <= 0.01,
      })),
    }));
  }, [months]);

  const pieSeries = useMemo(() => {
    const totalsByDebt: Record<string, number> = {};
    debtPaymentMatrix.forEach((row: any) => {
      row.payments.forEach((p: any) => {
        totalsByDebt[p.debtId] = (totalsByDebt[p.debtId] || 0) + (Number(p.totalPaid ?? 0) || 0);
      });
    });
    return orderedDebts.map((d: any) => ({
      debtId: d.id ?? d.debtId,
      label: d.name || `Debt ${d.order ?? ""}`.trim(),
      value: totalsByDebt[d.id ?? d.debtId] || 0,
    }));
  }, [debtPaymentMatrix, orderedDebts]);

  const calendarRows = useMemo(() => {
    return (months ?? []).map((m: any, idx: number) => {
      const paidOff = (m.payments ?? []).filter((p: any) => (Number(p.endingBalance ?? 0) || 0) <= 0.01 && (Number(p.totalPaid ?? 0) || 0) > 0);
      return {
        monthIndex: m.monthIndex ?? idx + 1,
        dateISO: m.dateISO ?? null,
        totalPaid: (Number(m.totals?.principal ?? 0) || 0) + (Number(m.totals?.interest ?? 0) || 0),
        principal: Number(m.totals?.principal ?? 0) || 0,
        interest: Number(m.totals?.interest ?? 0) || 0,
        outflow: Number(m.totals?.outflow ?? 0) || 0,
        snowball: Number(m.snowball ?? m.totals?.outflow ?? 0) || 0,
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
