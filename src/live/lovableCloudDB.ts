// src/live/lovableCloudDB.ts
// AppDB – DEPRECATED shim
// This no longer accesses user_plan_data. It rebuilds from the new source of truth
// and warns on every use so we can eventually delete it.

import { loadActivePlan, loadPlanSettings } from "@/lib/planStore";

/**
 * Legacy shape returned by AppDB.get, rebuilt from the new engine.
 * This matches what older consumers *think* they're getting.
 */
export type AppDBSnapshot = {
  debts: any[];
  settings: {
    strategy: "snowball" | "avalanche";
    extraMonthly: number;
    oneTimeExtra: number;
  };
  notes: string;
  plan: any;
  summary: {
    totalDebt: number;
    activeDebts: number;
    totalInterest: number;
    totalMonths: number;
    payoffDate: string | null;
  };
  updatedAt: string;
};

// Legacy PlanData type for backwards compatibility
export interface PlanData {
  debts: any[];
  settings: any;
  notes: string;
  plan: any;
  updatedAt: string;
  versions?: any[];
}

async function get(userId: string): Promise<AppDBSnapshot | null> {
  console.warn(
    "[AppDB.get] DEPRECATED. This is a compatibility shim using planStore; migrate callers to loadActivePlan/loadPlanSettings."
  );

  if (!userId) return null;

  const [activePlan, settings] = await Promise.all([
    loadActivePlan(userId),
    loadPlanSettings(userId),
  ]);

  const totalDebt =
    activePlan.summary?.totalDebt ??
    activePlan.debts.reduce((sum, d) => sum + d.balance, 0);

  return {
    debts: activePlan.debts,
    settings: {
      strategy: settings.strategy,
      extraMonthly: settings.extraPayment,
      oneTimeExtra: settings.oneTimePayment ?? 0,
    },
    notes: settings.notes ?? "",
    plan: activePlan.schedule,
    summary: {
      totalDebt,
      activeDebts: activePlan.summary?.activeDebts ?? activePlan.debts.length,
      totalInterest: activePlan.summary?.totalInterest ?? 0,
      totalMonths: activePlan.summary?.totalMonths ?? 0,
      payoffDate: activePlan.summary?.payoffDate ?? null,
    },
    updatedAt: new Date().toISOString(),
  };
}

async function put(_userId: string, _data: PlanData): Promise<void> {
  console.warn(
    "[AppDB.put] DEPRECATED and now a no-op. Settings are saved via savePlanSettings; debts are saved via the debts table."
  );
  return;
}

async function clear(_userId: string): Promise<void> {
  console.warn(
    "[AppDB.clear] DEPRECATED and now a no-op. Use planStore functions directly."
  );
  return;
}

export const AppDB = {
  get,
  put,
  clear,
};
