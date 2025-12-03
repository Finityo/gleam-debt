// ============================================================================
// src/lib/planStore.ts
// Finityo Plan Store – debts table as the ONLY source of truth.
// user_plan_data is now historical-only (protected by DB trigger).
// ============================================================================

import { supabase } from "@/integrations/supabase/client";
import { computeDebtPlanUnified } from "@/engine/unified-engine";
import type { DebtInput, PlanResult } from "@/lib/debtPlan";

export type DebtRecord = {
  id: string;
  user_id: string;
  name: string;
  balance: number;
  apr: number;
  min_payment: number;
  due_date: string | null;
  debt_type: string | null;
  notes: string | null;
  last4: string | null;
  created_at?: string;
  updated_at?: string;
};

export type PlanSnapshot = {
  debts: DebtRecord[];
  schedule: PlanResult["months"];
  summary: {
    totalDebt: number;
    activeDebts: number;
    totalInterest: number;
    totalMonths: number;
    payoffDate: string | null;
  };
  meta: {
    strategy: string;
    extraMonthly: number;
    oneTimeExtra: number;
    generatedAt: string;
  };
  notes: string;
};

export type PlanSettingsInput = {
  strategy: "snowball" | "avalanche";
  extraPayment: number;
  oneTimePayment?: number;
  notes?: string;
};

/**
 * Load all ACTIVE debts for a user from the debts table.
 * This is now the ONLY canonical read for debts.
 */
export async function loadUserDebts(userId: string): Promise<DebtRecord[]> {
  const { data, error } = await supabase
    .from("debts")
    .select("*")
    .eq("user_id", userId);

  if (error) {
    console.error("❌ loadUserDebts error:", error);
    throw error;
  }

  return (data ?? []) as DebtRecord[];
}

/**
 * Load plan settings from debt_calculator_settings table.
 */
export async function loadPlanSettings(userId: string): Promise<PlanSettingsInput & { notes: string }> {
  const { data, error } = await supabase
    .from("debt_calculator_settings")
    .select("strategy, extra_monthly, one_time, notes")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("❌ loadPlanSettings error:", error);
    throw error;
  }

  return {
    strategy: (data?.strategy as "snowball" | "avalanche") || "snowball",
    extraPayment: data?.extra_monthly ?? 0,
    oneTimePayment: data?.one_time ?? 0,
    notes: (data as any)?.notes ?? "",
  };
}

/**
 * Unified loader for live mode.
 * Pulls debts + calculator settings from DB and returns a full snapshot
 * for PlanContext + EngineLayer.
 */
export async function loadActivePlan(userId: string): Promise<PlanSnapshot> {
  // -------------------------------------------
  // Load debts
  // -------------------------------------------
  const { data: debtRows, error: debtErr } = await supabase
    .from("debts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (debtErr) {
    console.error("❌ loadActivePlan: debt load error", debtErr);
    throw debtErr;
  }

  const debts: DebtRecord[] = (debtRows || []).map((d) => ({
    id: d.id,
    user_id: d.user_id,
    name: d.name,
    balance: d.balance ?? 0,
    apr: d.apr ?? 0,
    min_payment: d.min_payment ?? 0,
    due_date: d.due_date,
    debt_type: d.debt_type,
    notes: d.notes,
    last4: d.last4,
    created_at: d.created_at,
    updated_at: d.updated_at,
  }));

  // -------------------------------------------
  // Load settings
  // -------------------------------------------
  const { data: settings, error: settingsErr } = await supabase
    .from("debt_calculator_settings")
    .select("strategy, extra_monthly, one_time, notes")
    .eq("user_id", userId)
    .maybeSingle();

  if (settingsErr) {
    console.error("❌ loadActivePlan: settings load error", settingsErr);
    throw settingsErr;
  }

  const strategy =
    (settings?.strategy as "snowball" | "avalanche") || "snowball";
  const extraMonthly = settings?.extra_monthly ?? 0;
  const oneTimeExtra = settings?.one_time ?? 0;
  const notes = settings?.notes ?? "";

  // Guard: if no debts, return empty snapshot
  if (!debts.length) {
    return {
      debts: [],
      schedule: [],
      summary: {
        totalDebt: 0,
        activeDebts: 0,
        totalInterest: 0,
        totalMonths: 0,
        payoffDate: null,
      },
      meta: {
        strategy,
        extraMonthly,
        oneTimeExtra,
        generatedAt: new Date().toISOString(),
      },
      notes,
    };
  }

  // Convert DB records to engine input format
  const debtInputs: DebtInput[] = debts.map((d) => ({
    id: d.id,
    name: d.name,
    balance: d.balance,
    apr: d.apr,
    minPayment: d.min_payment,
    include: true,
    category: d.debt_type || "",
    dueDay: d.due_date ? new Date(d.due_date).getDate() : undefined,
  }));

  // -------------------------------------------
  // Compute plan using unified engine
  // -------------------------------------------
  const plan = computeDebtPlanUnified({
    debts: debtInputs,
    strategy,
    extraMonthly,
    oneTimeExtra,
    startDate: new Date().toISOString().slice(0, 10),
  });

  const totalDebt = debts.reduce((sum, d) => sum + d.balance, 0);

  return {
    debts,
    schedule: plan.months,
    summary: {
      totalDebt,
      activeDebts: debts.length,
      totalInterest: plan.totals.interest,
      totalMonths: plan.months.length,
      payoffDate:
        plan.months.length > 0
          ? plan.months[plan.months.length - 1].dateISO
          : null,
    },
    meta: {
      strategy,
      extraMonthly,
      oneTimeExtra,
      generatedAt: new Date().toISOString(),
    },
    notes,
  };
}

/**
 * Save plan settings (strategy, extra payment, notes, etc.) to debt_calculator_settings.
 * Does NOT touch user_plan_data (which is now read-only).
 */
export async function savePlanSettings(
  userId: string,
  settings: PlanSettingsInput
): Promise<void> {
  const { error } = await supabase
    .from("debt_calculator_settings")
    .upsert(
      {
        user_id: userId,
        strategy: settings.strategy,
        extra_monthly: settings.extraPayment,
        one_time: settings.oneTimePayment ?? 0,
        notes: settings.notes ?? "",
        updated_at: new Date().toISOString(),
      } as any,
      { onConflict: "user_id" }
    );

  if (error) {
    console.error("❌ savePlanSettings error:", error);
    throw error;
  }
}

/**
 * Save just the notes field to debt_calculator_settings.
 */
export async function saveNotes(userId: string, notes: string): Promise<void> {
  const { error } = await supabase
    .from("debt_calculator_settings")
    .upsert(
      {
        user_id: userId,
        notes,
        updated_at: new Date().toISOString(),
      } as any,
      { onConflict: "user_id" }
    );

  if (error) {
    console.error("❌ saveNotes error:", error);
    throw error;
  }
}

/**
 * Add a new debt to the debts table.
 */
export async function addDebt(
  userId: string,
  debt: Omit<DebtRecord, "id" | "user_id" | "created_at" | "updated_at">
): Promise<DebtRecord> {
  const { data, error } = await supabase
    .from("debts")
    .insert({
      user_id: userId,
      name: debt.name,
      balance: debt.balance,
      apr: debt.apr,
      min_payment: debt.min_payment,
      due_date: debt.due_date,
      debt_type: debt.debt_type,
      notes: debt.notes,
      last4: debt.last4,
    })
    .select()
    .single();

  if (error) {
    console.error("❌ addDebt error:", error);
    throw error;
  }

  return data as DebtRecord;
}

/**
 * Update an existing debt in the debts table.
 */
export async function updateDebt(
  debtId: string,
  updates: Partial<Omit<DebtRecord, "id" | "user_id" | "created_at">>
): Promise<DebtRecord> {
  const { data, error } = await supabase
    .from("debts")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", debtId)
    .select()
    .single();

  if (error) {
    console.error("❌ updateDebt error:", error);
    throw error;
  }

  return data as DebtRecord;
}

// ===============================
// FIX: Ensure user_id stays intact on update
// ===============================
export async function updateDebtDB(id: string, changes: any) {
  const { data, error } = await supabase
    .from("debts")
    .update({
      name: changes.name,
      balance: changes.balance,
      apr: changes.apr,
      min_payment: changes.min_payment,
      debt_type: changes.debt_type ?? "",
      notes: changes.notes ?? "",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("❌ updateDebtDB failed:", error);
    throw error;
  }

  return data;
}

/**
 * Delete a debt from the debts table.
 */
export async function deleteDebt(debtId: string): Promise<void> {
  const { error } = await supabase
    .from("debts")
    .delete()
    .eq("id", debtId);

  if (error) {
    console.error("❌ deleteDebt error:", error);
    throw error;
  }
}

/**
 * IMPORTANT: No function in this file touches user_plan_data.
 * That table is now historical-only and governed by the DB trigger.
 */
