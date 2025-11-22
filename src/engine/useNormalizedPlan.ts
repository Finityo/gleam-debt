import { useDebtEngineFromStore } from "@/engine/useDebtEngineFromStore";

export function useNormalizedPlan() {
  const { plan, debtsUsed, settingsUsed, recompute } = useDebtEngineFromStore();

  // If plan is missing or malformed, safe-return a null bundle
  if (!plan || !Array.isArray(plan.months)) {
    console.warn("⚠️ Plan exists but months array missing. Returning null normalized plan.");
    return {
      plan: null,
      months: [],
      totals: null,
      debtsUsed,
      settingsUsed,
      recompute,
    };
  }

  // Convert plan.months → fully normalized structure
  const months = plan.months.map((m, idx) => ({
    monthIndex: m.monthIndex ?? idx,
    dateISO: m.dateISO ?? null,
    totals: {
      outflow: m.totals?.outflow ?? 0,
      principal: m.totals?.principal ?? 0,
      interest: m.totals?.interest ?? 0,
    },
    payments: (m.payments ?? []).map((p) => ({
      debtId: p.debtId,
      totalPaid: Number(p.totalPaid ?? 0),
      principal: Number(p.totalPaid ?? 0) - Number(p.interestAccrued ?? 0),
      interest: Number(p.interestAccrued ?? 0),
      endingBalance: Number(p.endingBalance ?? 0),
    })),
  }));

  const totals = {
    principal: plan.totals?.principal ?? 0,
    interest: plan.totals?.interest ?? 0,
    outflowMonthly: plan.totals?.outflowMonthly ?? 0,
    monthsToDebtFree: plan.totals?.monthsToDebtFree ?? months.length,
  };

  console.log("🔥 Normalized Plan → ", { months, totals });

  return { plan, months, totals, debtsUsed, settingsUsed, recompute };
}
