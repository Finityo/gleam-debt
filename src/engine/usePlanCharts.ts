import { useMemo } from "react";
import { useNormalizedPlan } from "@/engine/useNormalizedPlan";

/**
 * Centralized chart/visualization selector.
 * Every page that needs chart/table friendly data should use this hook.
 */
export function usePlanCharts() {
  const { plan, months, totals, debtsUsed, settingsUsed, recompute } =
    useNormalizedPlan();

  const orderedDebts = useMemo(() => {
    const list = plan?.debts || debtsUsed || [];
    return [...list].sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
  }, [plan, debtsUsed]);

  const payoffDateISO = useMemo(() => {
    if (!months?.length) return null;
    const last = months[months.length - 1];
    return last?.dateISO ?? null;
  }, [months]);

  // Line chart points: balance over time
  const lineSeries = useMemo(() => {
    const series =
      months?.map((m: any, idx: number) => ({
        x: m.monthIndex ?? idx + 1,
        dateISO: m.dateISO ?? null,
        principal: Number(m.totals?.principal ?? 0),
        interest: Number(m.totals?.interest ?? 0),
        outflow: Number(m.totals?.outflow ?? 0),
        totalPaid: Number(m.totals?.principal ?? 0) + Number(m.totals?.interest ?? 0),
        remainingBalance: m.payments.reduce((sum: number, p: any) => sum + Number(p.endingBalance ?? 0), 0),
      })) ?? [];
    return series;
  }, [months]);

  // Per-debt stacked bars / tables
  const debtPaymentMatrix = useMemo(() => {
    if (!months?.length) return [];
    return months.map((m: any, idx: number) => ({
      monthIndex: m.monthIndex ?? idx,
      dateISO: m.dateISO ?? null,
      payments:
        (m.payments ?? []).map((p: any) => ({
          debtId: p.debtId,
          totalPaid: Number(p.totalPaid ?? 0),
          principal: Number(p.principal ?? (Number(p.totalPaid ?? 0) - Number(p.interest ?? 0))),
          interest: Number(p.interest ?? 0),
          endingBalance: Number(p.endingBalance ?? 0),
          isClosed: Number(p.endingBalance ?? 0) <= 0.01,
        })) ?? [],
    }));
  }, [months]);

  // Pie chart distribution (total paid by debt)
  const pieSeries = useMemo(() => {
    const totalsByDebt: Record<string, number> = {};
    debtPaymentMatrix.forEach((row: any) => {
      row.payments.forEach((p: any) => {
        totalsByDebt[p.debtId] = (totalsByDebt[p.debtId] || 0) + Number(p.totalPaid ?? 0);
      });
    });
    return orderedDebts.map((d: any) => ({
      debtId: d.id ?? d.debtId,
      label: d.name || `Debt ${d.order ?? ""}`.trim(),
      value: totalsByDebt[d.id ?? d.debtId] || 0,
    }));
  }, [debtPaymentMatrix, orderedDebts]);

  // Calendar friendly view (month + debts closed)
  const calendarRows = useMemo(() => {
    return (
      months?.map((m: any, idx: number) => {
        const paidOff = (m.payments ?? []).filter(
          (p: any) => Number(p.endingBalance ?? 0) <= 0.01 && Number(p.totalPaid ?? 0) > 0
        );
        return {
          monthIndex: m.monthIndex ?? idx + 1,
          dateISO: m.dateISO ?? null,
          totalPaid: Number(m.totals?.principal ?? 0) + Number(m.totals?.interest ?? 0),
          principal: Number(m.totals?.principal ?? 0),
          interest: Number(m.totals?.interest ?? 0),
          outflow: Number(m.totals?.outflow ?? 0),
          snowball: Number(m.snowball ?? m.totals?.outflow ?? 0),
          paidOffDebts: paidOff.map((p: any) => p.debtId),
        };
      }) ?? []
    );
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
