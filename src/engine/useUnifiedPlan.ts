import { useContext, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { DemoPlanContext } from "@/context/DemoPlanContext";
import { usePlanCharts } from "@/engine/usePlanCharts";
import { toNum } from "@/engine/plan-helpers";

/**
 * useUnifiedPlan
 * One hook that demo + live pages can use with zero branching.
 * - If you are inside /setup/* AND DemoPlanProvider is mounted, it uses demo plan
 * - Otherwise it uses live store via usePlanCharts()
 *
 * This lets every page consume the same normalized/charted shape.
 */
export function useUnifiedPlan() {
  const location = useLocation();
  const demoCtx = useContext(DemoPlanContext);
  const live = usePlanCharts();

  const isSetupRoute = location.pathname.startsWith("/setup") || location.pathname.startsWith("/demo");
  const hasDemoPlan = !!demoCtx?.plan;

  // Normalize live engine data
  const liveNormalized = useMemo(() => {
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
      debtsUsed: live.debtsUsed ?? [],
      settingsUsed: live.settingsUsed ?? {},
      recompute: live.recompute ?? (() => {}),
    };
  }, [live]);

  // Normalize demo into the same shape as live
  const demoNormalized = useMemo(() => {
    if (!demoCtx?.plan) return null;

    // DemoPlanContext already produces plan-like shape.
    // We only map to the fields we need, mirroring useNormalizedPlan/usePlanCharts output.
    const plan = demoCtx.plan;
    const months = (plan.months ?? []).map((m: any, idx: number) => ({
      monthIndex: Number(m.monthIndex ?? idx + 1),
      dateISO: m.dateISO ?? null,
      totals: {
        outflow: Number(m.totals?.outflow ?? 0),
        principal: Number(m.totals?.principal ?? 0),
        interest: Number(m.totals?.interest ?? 0),
      },
      snowball: Number(m.snowball ?? m.totals?.outflow ?? 0),
      payments: (m.payments ?? []).map((p: any) => {
        const totalPaid = Number(p.totalPaid ?? 0);
        const interest = Number(p.interest ?? 0);
        const principal = Number(p.principal ?? (totalPaid - interest));
        return {
          debtId: p.debtId,
          totalPaid,
          principal,
          interest,
          endingBalance: Number(p.endingBalance ?? 0),
          isClosed: Number(p.endingBalance ?? 0) <= 0.01,
        };
      }),
    }));

    const totals = {
      principal: Number(plan.totals?.principal ?? 0),
      interest: Number(plan.totals?.interest ?? 0),
      outflowMonthly: Number(plan.totals?.outflowMonthly ?? 0),
      monthsToDebtFree: Number(plan.totals?.monthsToDebtFree ?? months.length),
    };

    const orderedDebts = [...(plan.debts ?? [])].sort(
      (a: any, b: any) => (a.order ?? 0) - (b.order ?? 0)
    );

    const payoffDateISO = months.length
      ? months[months.length - 1]?.dateISO ?? null
      : null;

    // Rebuild chart series from demo months/debts
    const lineSeries = months.map((m: any) => ({
      x: m.monthIndex,
      dateISO: m.dateISO,
      principal: m.totals.principal,
      interest: m.totals.interest,
      outflow: m.totals.outflow,
      totalPaid: m.totals.principal + m.totals.interest,
      remainingBalance: (m.payments ?? []).reduce(
        (sum: number, p: any) => sum + Number(p.endingBalance ?? 0),
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
          (totalsByDebt[p.debtId] || 0) + Number(p.totalPaid ?? 0);
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
          Number(p.endingBalance ?? 0) <= 0.01 &&
          Number(p.totalPaid ?? 0) > 0
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
      plan,
      months,
      totals,
      orderedDebts,
      payoffDateISO,
      lineSeries,
      pieSeries,
      debtPaymentMatrix,
      calendarRows,
      debtsUsed: demoCtx.debtsUsed ?? demoCtx.inputs?.debts ?? [],
      settingsUsed: demoCtx.settingsUsed ?? {},
      recompute: demoCtx.recompute ?? (() => {}),
    };
  }, [demoCtx]);

  // Choose demo when appropriate, else live
  if (isSetupRoute && hasDemoPlan && demoNormalized) return demoNormalized;
  return liveNormalized ?? {
    plan: null,
    months: [],
    totals: { principal: 0, interest: 0, outflowMonthly: 0, monthsToDebtFree: 0 },
    orderedDebts: [],
    payoffDateISO: null,
    lineSeries: [],
    pieSeries: [],
    debtPaymentMatrix: [],
    calendarRows: [],
    debtsUsed: [],
    settingsUsed: {},
    recompute: async () => {},
  };
}
