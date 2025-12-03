// ============================================================================
// LOVABLE CLOUD DB — Plan Data Persistence (v2)
// Finityo — 2025
//
// Now uses debts + debt_calculator_settings as source of truth.
// user_plan_data is read-only (historical data).
// ============================================================================

import { supabase } from "@/integrations/supabase/client";
import {
  loadActivePlan,
  loadPlanSettings,
  savePlanSettings,
  loadUserDebts,
  addDebt,
  updateDebt,
  deleteDebt,
  type DebtRecord,
  type PlanSettingsInput,
} from "@/lib/planStore";
import type { Debt, UserSettings, DebtPlan } from "@/lib/computeDebtPlan";

export interface PlanData {
  debts: Debt[];
  settings: UserSettings;
  notes: string;
  plan: DebtPlan | null;
  updatedAt: string;
  versions?: any[];
}

export const AppDB = {
  /**
   * Get user's plan data from Lovable Cloud
   * Now reads from debts table + debt_calculator_settings + computes plan
   */
  async get(userId: string): Promise<PlanData | null> {
    try {
      const [activePlan, settings] = await Promise.all([
        loadActivePlan(userId),
        loadPlanSettings(userId),
      ]);

      // Map DebtRecord to legacy Debt format
      const debts: Debt[] = activePlan.debts.map((d) => ({
        id: d.id,
        name: d.name,
        balance: d.balance,
        minPayment: d.min_payment,
        apr: d.apr,
        category: d.debt_type ?? undefined,
        dueDay: d.due_date ? new Date(d.due_date).getDate() : undefined,
      }));

      return {
        debts,
        settings: {
          strategy: settings.strategy,
          extraMonthly: settings.extraPayment,
          oneTimeExtra: settings.oneTimePayment ?? 0,
        },
        notes: settings.notes ?? "",
        plan: activePlan.schedule as any, // PlanMonth[] for backwards compat
        updatedAt: new Date().toISOString(),
        versions: [], // Versions are now in user_plan_versions table
      };
    } catch (err) {
      console.error("❌ AppDB.get error:", err);
      return null;
    }
  },

  /**
   * Save user's plan data to Lovable Cloud
   * Now writes to debts table + debt_calculator_settings
   * 
   * NOTE: This is a compatibility shim. Prefer using planStore functions directly.
   */
  async put(userId: string, data: PlanData): Promise<void> {
    try {
      // 1. Save settings
      await savePlanSettings(userId, {
        strategy: data.settings?.strategy ?? "snowball",
        extraPayment: data.settings?.extraMonthly ?? 0,
        oneTimePayment: data.settings?.oneTimeExtra ?? 0,
      });

      // 2. Save notes
      if (data.notes !== undefined) {
        await supabase
          .from("debt_calculator_settings")
          .update({ notes: data.notes })
          .eq("user_id", userId);
      }

      // 3. Sync debts (upsert each debt)
      // This is expensive - prefer using addDebt/updateDebt/deleteDebt directly
      if (data.debts && data.debts.length > 0) {
        const existingDebts = await loadUserDebts(userId);
        const existingIds = new Set(existingDebts.map((d) => d.id));

        for (const debt of data.debts) {
          const debtRecord = {
            name: debt.name,
            balance: debt.balance,
            min_payment: debt.minPayment,
            apr: debt.apr,
            debt_type: debt.category ?? null,
            due_date: debt.dueDay
              ? `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(debt.dueDay).padStart(2, "0")}`
              : null,
            notes: null,
            last4: null,
          };

          if (debt.id && existingIds.has(debt.id)) {
            await updateDebt(debt.id, debtRecord);
          } else {
            await addDebt(userId, debtRecord);
          }
        }
      }

      console.log("✅ AppDB.put completed (v2)");
    } catch (err) {
      console.error("❌ AppDB.put error:", err);
      throw err;
    }
  },

  /**
   * Clear user's plan data from Lovable Cloud
   * Resets settings and optionally deletes all debts
   */
  async clear(userId: string): Promise<void> {
    try {
      // Reset settings to defaults
      await savePlanSettings(userId, {
        strategy: "snowball",
        extraPayment: 0,
        oneTimePayment: 0,
      });

      await supabase
        .from("debt_calculator_settings")
        .update({ notes: "" })
        .eq("user_id", userId);

      // Note: We don't delete debts here to prevent accidental data loss
      // If you want to delete all debts, call deleteDebt for each one

      console.log("✅ AppDB.clear completed (v2)");
    } catch (err) {
      console.error("❌ AppDB.clear error:", err);
      throw err;
    }
  },

  /**
   * Delete all debts for a user (use with caution!)
   */
  async deleteAllDebts(userId: string): Promise<void> {
    const debts = await loadUserDebts(userId);
    for (const debt of debts) {
      await deleteDebt(debt.id);
    }
    console.log(`✅ Deleted ${debts.length} debts for user ${userId}`);
  },
};
