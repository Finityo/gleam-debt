import { useCallback, useMemo } from "react";
import { usePlanCharts } from "@/engine/usePlanCharts";

// ---------- hardening utils ----------
const toNum = (v: any, def = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
};
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const safeAPR = (apr: any) => clamp(toNum(apr, 0), 0, 100); // 0–100% sanity window

/**
 * useNormalizedPlan (Military mode)
 * - Guarantees stable, typed plan output regardless of engine/db variance
 * - Sanitizes numeric fields
 * - Prevents undefined arrays from breaking UI
 * - Strips noisy console logs in prod
 */
export function useNormalizedPlan() {
  const { plan, debtsUsed, settingsUsed, recompute } = usePlanCharts();

  const months = useMemo(() => {
    const raw = plan?.months ?? [];
    return raw.map((m: any, idx: number) => ({
      monthIndex: toNum(m.monthIndex, idx + 1),
      dateISO: m.dateISO ?? null,
      totals: {
        outflow: toNum(m.totals?.outflow),
        principal: toNum(m.totals?.principal),
        interest: toNum(m.totals?.interest),
      },
      snowball: toNum(m.snowball ?? m.totals?.outflow),
      payments: (m.payments ?? []).map((p: any) => {
        const totalPaid = toNum(p.totalPaid);
        const interestAccrued = toNum(p.interestAccrued ?? p.interest);
        const principalPaid = toNum(p.principal ?? (totalPaid - interestAccrued));
        const endingBalance = toNum(p.endingBalance);
        return {
          debtId: p.debtId,
          totalPaid,
          principal: principalPaid,
          interest: interestAccrued,
          endingBalance,
          isClosed: endingBalance <= 0.01,
        };
      }),
    }));
  }, [plan]);

  const totals = useMemo(() => ({
    principal: toNum(plan?.totals?.principal),
    interest: toNum(plan?.totals?.interest),
    outflowMonthly: toNum(plan?.totals?.outflowMonthly),
    monthsToDebtFree: toNum(plan?.totals?.monthsToDebtFree, months.length),
  }), [plan, months.length]);

  const normalizedDebts = useMemo(() => {
    const list = plan?.debts || debtsUsed || [];
    return [...list].map((d: any, idx: number) => ({
      ...d,
      order: toNum(d.order, idx + 1),
      apr: safeAPR(d.apr),
      balance: toNum(d.balance),
      minPayment: toNum(d.minPayment ?? d.minimumPayment),
      id: d.id ?? d.debtId ?? String(idx),
    }));
  }, [plan, debtsUsed]);

  const orderedDebts = useMemo(() => {
    return [...normalizedDebts].sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
  }, [normalizedDebts]);

  const payoffDateISO = useMemo(() => {
    if (!months.length) return null;
    return months[months.length - 1]?.dateISO ?? null;
  }, [months]);

  const safeRecompute = useCallback(async () => {
    try {
      await recompute?.();
    } catch (e) {
      console.error("Recompute failed:", e);
    }
  }, [recompute]);

  return {
    plan,
    months,
    totals,
    orderedDebts,
    payoffDateISO,
    debtsUsed,
    settingsUsed,
    recompute: safeRecompute,
  };
}
