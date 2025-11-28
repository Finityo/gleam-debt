import React, { createContext, useContext, useEffect, useState } from "react";
import type { Debt, UserSettings, DebtPlan } from "@/lib/computeDebtPlan";
import { computeDebtPlanUnified } from "@/engine/unified-engine";
import type { DebtInput } from "@/engine/plan-types";
import type { Scenario } from "./ScenarioContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { PlanAPI } from "@/lib/planAPI";

export type AppState = {
  debts: Debt[];
  settings: UserSettings;
  scenarios: Scenario[];
  activeScenarioId: string | null;
  plan: DebtPlan | null;
  notifications: string[];
  notes: string;
};

type Ctx = {
  state: AppState;
  updateDebts: (debts: Debt[]) => void;
  addDebt: (d: Partial<Debt>) => Promise<void>;
  updateDebt: (id: string, patch: Partial<Debt>) => Promise<void>;
  deleteDebt: (id: string) => Promise<void>;
  clearDebts: () => Promise<void>;
  updateSettings: (patch: Partial<UserSettings>) => Promise<void>;
  updateNotes: (notes: string) => void;
  computeNow: () => void;
  notify: (msg: string) => void;
  clearNotifications: () => void;
};

const AppStore = createContext<Ctx>(null as any);

const LOCAL_STORAGE_KEY = "finityo:migrated";

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<AppState>({
    debts: [],
    scenarios: [],
    settings: {
      strategy: "snowball",
      extraMonthly: 200,
      oneTimeExtra: 0,
    },
    activeScenarioId: null,
    plan: null,
    notifications: [],
    notes: "",
  });

  // Load user data from database
  useEffect(() => {
    if (!user) return;

    (async () => {
      try {
        // Check if migration from localStorage is needed (one-time)
        const migrated = localStorage.getItem(LOCAL_STORAGE_KEY);
        
        // Load debts
        const { data: debts } = await supabase
          .from("debts")
          .select("*")
          .eq("user_id", user.id);

        // Load settings
        const { data: settings } = await supabase
          .from("debt_calculator_settings")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        setState((s) => ({
          ...s,
          debts: debts?.map(d => ({
            id: d.id,
            name: d.name,
            balance: Number(d.balance),
            apr: Number(d.apr),
            minPayment: Number(d.min_payment),
            category: d.debt_type,
          })) || [],
          settings: settings
            ? {
                strategy: settings.strategy as "snowball" | "avalanche",
                extraMonthly: Number(settings.extra_monthly),
                oneTimeExtra: Number(settings.one_time),
              }
            : s.settings,
        }));

        // Mark migration as complete
        if (!migrated) {
          localStorage.setItem(LOCAL_STORAGE_KEY, "true");
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      }
    })();
  }, [user]);

  // CRITICAL FIX: AppStore should NOT compute plans independently
  // Delegate to DebtEngineProvider to avoid dual state management
  const computeNow = () => {
    // This is now a no-op - plan computation happens in DebtEngineProvider
    // Pages should use useUnifiedPlan() to access the computed plan
    console.warn("AppStore.computeNow() is deprecated - use useUnifiedPlan() instead");
  };

  // Debts CRUD
  const addDebt = async (d: Partial<Debt>) => {
    if (!user) return;

    const newDebt: Debt = {
      id: "debt-" + Math.random().toString(36).slice(2, 9),
      name: d.name ?? "New Debt",
      balance: d.balance ?? 0,
      apr: d.apr ?? 0,
      minPayment: d.minPayment ?? 0,
      dueDay: d.dueDay,
      category: d.category,
    };

    // Save to database
    const { error } = await supabase.from("debts").insert({
      user_id: user.id,
      name: newDebt.name,
      balance: newDebt.balance,
      apr: newDebt.apr,
      min_payment: newDebt.minPayment,
      debt_type: newDebt.category || "personal",
    });

    if (error) {
      console.error("Error adding debt:", error);
      return;
    }

    setState((s) => {
      const newState = { ...s, debts: [...s.debts, newDebt] };
      
      // CRITICAL FIX: Do NOT compute plan here - let DebtEngineProvider handle it
      // Sync with PlanAPI for Plan page
      PlanAPI.writeAndCompute(user.id, {
        debts: newState.debts,
        settings: newState.settings,
      }, `Added debt: ${newDebt.name}`).catch(err => 
        console.error("Error syncing with PlanAPI:", err)
      );
      
      return { ...newState, plan: null }; // Plan will be computed by engine
    });
  };

  const updateDebt = async (id: string, patch: Partial<Debt>) => {
    if (!user) return;

    // Update in database
    const debt = state.debts.find((d) => d.id === id);
    if (debt) {
      const { error } = await supabase
        .from("debts")
        .update({
          name: patch.name ?? debt.name,
          balance: patch.balance ?? debt.balance,
          apr: patch.apr ?? debt.apr,
          min_payment: patch.minPayment ?? debt.minPayment,
          debt_type: patch.category ?? debt.category ?? "personal",
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .eq("id", id);

      if (error) {
        console.error("Error updating debt:", error);
        return;
      }
    }

    setState((s) => {
      const newDebts = s.debts.map((d) => (d.id === id ? { ...d, ...patch } : d));
      
      // CRITICAL FIX: Do NOT compute plan here - let DebtEngineProvider handle it
      // Sync with PlanAPI for Plan page
      PlanAPI.writeAndCompute(user.id, {
        debts: newDebts,
        settings: s.settings,
      }, `Updated debt: ${patch.name || debt?.name || 'Unknown'}`).catch(err => 
        console.error("Error syncing with PlanAPI:", err)
      );
      
      return { ...s, debts: newDebts, plan: null }; // Plan will be computed by engine
    });
  };

  const deleteDebt = async (id: string) => {
    if (!user) return;

    const { error } = await supabase
      .from("debts")
      .delete()
      .eq("user_id", user.id)
      .eq("id", id);

    if (error) {
      console.error("Error deleting debt:", error);
      return;
    }

    setState((s) => {
      const newDebts = s.debts.filter((d) => d.id !== id);
      
      // CRITICAL FIX: Do NOT compute plan here - let DebtEngineProvider handle it
      // Sync with PlanAPI for Plan page
      PlanAPI.writeAndCompute(user.id, {
        debts: newDebts,
        settings: s.settings,
      }, `Deleted debt`).catch(err => 
        console.error("Error syncing with PlanAPI:", err)
      );
      
      return { ...s, debts: newDebts, plan: null }; // Plan will be computed by engine
    });
  };

  const clearDebts = async () => {
    if (!user) return;

    // Delete all debts from database
    const { error } = await supabase
      .from("debts")
      .delete()
      .eq("user_id", user.id);

    if (error) {
      console.error("Error clearing debts:", error);
      return;
    }

    setState((s) => {
      // Sync with PlanAPI for Plan page
      PlanAPI.writeAndCompute(user.id, {
        debts: [],
        settings: s.settings,
      }, `Cleared all debts`).catch(err => 
        console.error("Error syncing with PlanAPI:", err)
      );
      
      return { ...s, debts: [], plan: null };
    });
  };

  const updateDebts = (debts: Debt[]) => {
    setState((s) => {
      // CRITICAL FIX: Do NOT compute plan here - let DebtEngineProvider handle it
      return { ...s, debts, plan: null }; // Plan will be computed by engine
    });
  };

  // Settings
  const updateSettings = async (patch: Partial<UserSettings>) => {
    if (!user) return;

    const newSettings = { ...state.settings, ...patch };

    // Save to database
    const { error } = await supabase
      .from("debt_calculator_settings")
      .upsert({
        user_id: user.id,
        strategy: newSettings.strategy,
        extra_monthly: newSettings.extraMonthly,
        one_time: newSettings.oneTimeExtra || 0,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error("Error updating settings:", error);
      return;
    }

    setState((s) => {
      // CRITICAL FIX: Do NOT compute plan here - let DebtEngineProvider handle it
      return { ...s, settings: newSettings, plan: null }; // Plan will be computed by engine
    });
  };

  // Notes
  const updateNotes = (notes: string) => {
    setState((s) => ({ ...s, notes }));
  };

  // Notifications
  const notify = (msg: string) => {
    setState((s) => ({ ...s, notifications: [...s.notifications, msg] }));
    // Auto-clear after 5 seconds
    setTimeout(() => {
      setState((s) => ({
        ...s,
        notifications: s.notifications.filter((n) => n !== msg),
      }));
    }, 5000);
  };

  const clearNotifications = () => setState((s) => ({ ...s, notifications: [] }));

  return (
    <AppStore.Provider
      value={{
        state,
        addDebt,
        updateDebt,
        deleteDebt,
        clearDebts,
        updateDebts,
        updateSettings,
        updateNotes,
        computeNow,
        notify,
        clearNotifications,
      }}
    >
      {children}
    </AppStore.Provider>
  );
}

export function useApp() {
  const context = useContext(AppStore);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
}
