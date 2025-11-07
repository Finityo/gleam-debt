// ============================================================================
// LOVABLE CLOUD DB — Plan Data Persistence
// Finityo — 2025
//
// Stores user plan data (debts, settings, notes, computed plan) in Supabase
// ============================================================================

import { supabase } from "@/integrations/supabase/client";
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
   */
  async get(userId: string): Promise<PlanData | null> {
    try {
      const { data, error } = await supabase
        .from("user_plan_data")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("❌ AppDB.get error:", error);
        return null;
      }

      if (!data) return null;

      return {
        debts: (data.debts as any) || [],
        settings: (data.settings as any) || {},
        notes: (data.notes as string) || "",
        plan: (data.plan as any) || null,
        updatedAt: data.updated_at,
        versions: (data.versions as any) || [],
      };
    } catch (err) {
      console.error("❌ AppDB.get exception:", err);
      return null;
    }
  },

  /**
   * Save user's plan data to Lovable Cloud
   */
  async put(userId: string, data: PlanData): Promise<void> {
    try {
      const { error } = await supabase
        .from("user_plan_data")
        .upsert({
          user_id: userId,
          debts: data.debts as any,
          settings: data.settings as any,
          notes: data.notes,
          plan: data.plan as any,
          updated_at: data.updatedAt,
          versions: data.versions as any,
        } as any, {
          onConflict: "user_id",
        });

      if (error) {
        console.error("❌ AppDB.put error:", error);
        throw error;
      }
    } catch (err) {
      console.error("❌ AppDB.put exception:", err);
      throw err;
    }
  },

  /**
   * Clear user's plan data from Lovable Cloud
   */
  async clear(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("user_plan_data")
        .delete()
        .eq("user_id", userId) as any;

      if (error) {
        console.error("❌ AppDB.clear error:", error);
        throw error;
      }
    } catch (err) {
      console.error("❌ AppDB.clear exception:", err);
      throw err;
    }
  },
};
