// src/lib/planAPI.ts
// Finityo Plan API – v2
// - No longer touches user_plan_data (now historical & read-only)
// - Uses debts + debt_calculator_settings as live source of truth
// - Stores version history in user_plan_versions

import { supabase } from "@/integrations/supabase/client";
import {
  loadActivePlan,
  loadPlanSettings,
  savePlanSettings,
  type PlanSettingsInput,
  type DebtRecord,
} from "@/lib/planStore";

/**
 * Shape of a legacy-style plan snapshot, used for history / inspection.
 * This mirrors the old PlanAPI payload but is rebuilt from the new engine.
 */
export type LegacyPlanSnapshot = {
  debts: DebtRecord[];
  settings: {
    strategy: "snowball" | "avalanche";
    extraMonthly: number;
    oneTimeExtra: number;
  };
  notes: string;
  plan: any; // engine plan (months/totals/etc.)
  summary: {
    totalDebt: number;
    activeDebts: number;
    totalInterest: number;
    totalMonths: number;
    payoffDate: string | null;
  };
  updatedAt: string;
};

// Legacy types for backwards compatibility
export type PlanData = {
  debts: any[];
  settings: any;
  notes: string;
  plan: any;
  updatedAt: string;
  versions?: any[];
  migratedFrom?: string;
  migratedMode?: string;
};

export type VersionRecord = {
  versionId: string;
  createdAt: string;
  debts: any[];
  settings: any;
  plan: any;
  notes: string | null;
};

export type PlanVersionRow = {
  id: string;
  user_id: string;
  snapshot: LegacyPlanSnapshot;
  description: string | null;
  created_at: string;
};

/**
 * Build a full "plan snapshot" from the NEW source of truth:
 * - debts table
 * - debt_calculator_settings
 * - unified engine output
 */
export async function buildCurrentSnapshot(
  userId: string
): Promise<LegacyPlanSnapshot> {
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

/**
 * Legacy-style get(): now rebuilt from the new store/engine.
 * Kept for any older consumers that still call PlanAPI.get.
 */
async function get(userId: string): Promise<PlanData | null> {
  try {
    const snapshot = await buildCurrentSnapshot(userId);
    return {
      debts: snapshot.debts,
      settings: snapshot.settings,
      notes: snapshot.notes,
      plan: snapshot.plan,
      updatedAt: snapshot.updatedAt,
    };
  } catch (err) {
    console.error("[PlanAPI.get] Failed to build snapshot:", err);
    return null;
  }
}

/**
 * Legacy-style save(): NO LONGER writes a blob anywhere.
 * It now:
 *  - updates settings in debt_calculator_settings
 *  - optionally logs a version to user_plan_versions
 *
 * Debts themselves are saved through the debts table directly.
 */
async function save(
  userId: string,
  payload: Partial<PlanData> & {
    logVersion?: boolean;
    versionDescription?: string;
  }
): Promise<void> {
  console.warn(
    "[PlanAPI.save] Called in compatibility mode. Debts are now saved via the debts table; this only updates settings/notes."
  );

  // 1) Update settings + notes in debt_calculator_settings
  const currentSettings = await loadPlanSettings(userId);
  
  await savePlanSettings(userId, {
    strategy: payload.settings?.strategy ?? currentSettings.strategy,
    extraPayment: payload.settings?.extraMonthly ?? currentSettings.extraPayment ?? 0,
    oneTimePayment: payload.settings?.oneTimeExtra ?? currentSettings.oneTimePayment ?? 0,
  });

  // Save notes if provided
  if (payload.notes !== undefined) {
    const { error } = await supabase
      .from("debt_calculator_settings")
      .update({ notes: payload.notes })
      .eq("user_id", userId);
    
    if (error) {
      console.error("[PlanAPI.save] Failed to update notes:", error);
    }
  }

  // 2) Optionally log a new version if requested
  if (payload.logVersion) {
    await logVersion(userId, payload.versionDescription);
  }
}

/**
 * Legacy compute(): now just returns the snapshot from planStore
 * which already runs computeDebtPlanUnified
 */
async function compute(userId: string): Promise<PlanData> {
  const snapshot = await buildCurrentSnapshot(userId);
  return {
    debts: snapshot.debts,
    settings: snapshot.settings,
    notes: snapshot.notes,
    plan: snapshot.plan,
    updatedAt: snapshot.updatedAt,
  };
}

/**
 * Legacy writeAndCompute(): saves settings and returns computed plan
 * Debts must be saved separately via planStore.addDebt/updateDebt
 */
async function writeAndCompute(
  userId: string,
  next: {
    debts?: any[];
    settings?: any;
    notes?: string;
  },
  changeDescription?: string
): Promise<PlanData> {
  // Save settings if provided
  if (next.settings) {
    await savePlanSettings(userId, {
      strategy: next.settings.strategy ?? "snowball",
      extraPayment: next.settings.extraMonthly ?? 0,
      oneTimePayment: next.settings.oneTimeExtra ?? 0,
    });
  }

  // Save notes if provided
  if (next.notes !== undefined) {
    await supabase
      .from("debt_calculator_settings")
      .update({ notes: next.notes })
      .eq("user_id", userId);
  }

  // Note: debts should be saved directly via planStore functions
  // This is a compatibility shim - caller should use planStore for debts

  // Log version
  await logVersion(userId, changeDescription);

  // Return computed snapshot
  return compute(userId);
}

/**
 * Legacy clear(): resets settings to defaults
 * Does NOT delete debts - that must be done separately
 */
async function clear(userId: string): Promise<void> {
  await savePlanSettings(userId, {
    strategy: "snowball",
    extraPayment: 0,
    oneTimePayment: 0,
  });
  
  await supabase
    .from("debt_calculator_settings")
    .update({ notes: "" })
    .eq("user_id", userId);
}

/**
 * Log a snapshot of the user's current plan into user_plan_versions.
 * This is used for historical inspection / "version history".
 */
async function logVersion(
  userId: string,
  description?: string
): Promise<void> {
  const snapshot = await buildCurrentSnapshot(userId);

  const { error } = await supabase.from("user_plan_versions").insert({
    user_id: userId,
    version_id: crypto.randomUUID(),
    snapshot: snapshot as any,
    description: description ?? null,
    debts: snapshot.debts as any,
    settings: snapshot.settings as any,
    plan: snapshot.plan as any,
    notes: snapshot.notes,
    change_description: description ?? "Plan updated",
  });

  if (error) {
    console.error("[PlanAPI.logVersion] Failed to insert version:", error);
    // Don't throw - version logging is non-critical
  } else {
    console.log("[PlanAPI.logVersion] ✅ Version logged");
  }
}

/**
 * List prior versions of the user's plan (newest first).
 */
async function listVersions(userId: string): Promise<VersionRecord[]> {
  const { data, error } = await supabase
    .from("user_plan_versions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[PlanAPI.listVersions] Failed to load versions:", error);
    return [];
  }

  // Map to VersionRecord format for backwards compatibility
  return (data ?? []).map((row: any) => ({
    versionId: row.version_id ?? row.id,
    createdAt: row.created_at,
    debts: row.debts ?? row.snapshot?.debts ?? [],
    settings: row.settings ?? row.snapshot?.settings ?? {},
    plan: row.plan ?? row.snapshot?.plan ?? null,
    notes: row.notes ?? row.snapshot?.notes ?? null,
  }));
}

/**
 * Fetch a single version record by version_id.
 */
async function getVersion(
  userId: string,
  versionId: string
): Promise<VersionRecord | null> {
  const { data, error } = await supabase
    .from("user_plan_versions")
    .select("*")
    .eq("user_id", userId)
    .or(`version_id.eq.${versionId},id.eq.${versionId}`)
    .maybeSingle();

  if (error) {
    console.error("[PlanAPI.getVersion] Failed to load version:", error);
    return null;
  }

  if (!data) return null;

  return {
    versionId: data.version_id ?? data.id,
    createdAt: data.created_at,
    debts: data.debts ?? (data as any).snapshot?.debts ?? [],
    settings: data.settings ?? (data as any).snapshot?.settings ?? {},
    plan: data.plan ?? (data as any).snapshot?.plan ?? null,
    notes: data.notes ?? (data as any).snapshot?.notes ?? null,
  };
}

/**
 * Restore logic: returns the snapshot for the caller to decide what to do.
 * We do NOT write directly into debts here, to keep it explicit & safe.
 */
async function restoreVersion(
  userId: string,
  versionId: string
): Promise<PlanData | null> {
  const v = await getVersion(userId, versionId);
  if (!v) return null;

  return {
    debts: v.debts,
    settings: v.settings,
    notes: v.notes ?? "",
    plan: v.plan,
    updatedAt: v.createdAt,
  };
}

// Export in the same shape as before, but v2-safe.
export const PlanAPI = {
  get,
  save,
  compute,
  writeAndCompute,
  clear,
  logVersion,
  listVersions,
  getVersion,
  restoreVersion,
};
