import React, { createContext, useContext, useEffect, useState } from "react";
import type { Debt, UserSettings, DebtPlan } from "@/lib/computeDebtPlan";
import { computeDebtPlan } from "@/lib/computeDebtPlan";
import type { Scenario } from "./ScenarioContext";
import { getUserId } from "@/lib/user";
import { dbGet, dbSet } from "@/live/db";

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
  addDebt: (d: Partial<Debt>) => void;
  updateDebt: (id: string, patch: Partial<Debt>) => void;
  deleteDebt: (id: string) => void;
  updateSettings: (patch: Partial<UserSettings>) => void;
  updateNotes: (notes: string) => void;
  computeNow: () => void;
  notify: (msg: string) => void;
  clearNotifications: () => void;
};

const AppStore = createContext<Ctx>(null as any);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const userId = getUserId();
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

  // Load initial user data
  useEffect(() => {
    (async () => {
      const saved = await dbGet(userId);
      if (saved) {
        setState(saved);
        // Recompute on load
        if (saved.debts?.length && saved.settings) {
          const plan = computeDebtPlan(saved.debts, saved.settings);
          setState((s) => ({ ...s, plan }));
        }
      }
    })();
  }, [userId]);

  // Sync to DB on change (debounced)
  useEffect(() => {
    const timeout = setTimeout(() => {
      dbSet(userId, state);
    }, 500);
    return () => clearTimeout(timeout);
  }, [state, userId]);

  // Central recompute
  const computeNow = () => {
    if (!state.debts.length) {
      setState((s) => ({ ...s, plan: null }));
      return;
    }
    const plan = computeDebtPlan(state.debts, state.settings);
    setState((s) => ({ ...s, plan }));
  };

  // Debts CRUD
  const addDebt = (d: Partial<Debt>) => {
    const newDebt: Debt = {
      id: "debt-" + Math.random().toString(36).slice(2, 9),
      name: d.name ?? "New Debt",
      balance: d.balance ?? 0,
      apr: d.apr ?? 0,
      minPayment: d.minPayment ?? 0,
      dueDay: d.dueDay,
      category: d.category,
    };
    setState((s) => {
      const newState = { ...s, debts: [...s.debts, newDebt] };
      const plan = computeDebtPlan(newState.debts, newState.settings);
      return { ...newState, plan };
    });
  };

  const updateDebt = (id: string, patch: Partial<Debt>) => {
    setState((s) => {
      const newDebts = s.debts.map((d) => (d.id === id ? { ...d, ...patch } : d));
      const plan = computeDebtPlan(newDebts, s.settings);
      return { ...s, debts: newDebts, plan };
    });
  };

  const deleteDebt = (id: string) => {
    setState((s) => {
      const newDebts = s.debts.filter((d) => d.id !== id);
      const plan = newDebts.length ? computeDebtPlan(newDebts, s.settings) : null;
      return { ...s, debts: newDebts, plan };
    });
  };

  const updateDebts = (debts: Debt[]) => {
    setState((s) => {
      const plan = debts.length ? computeDebtPlan(debts, s.settings) : null;
      return { ...s, debts, plan };
    });
  };

  // Settings
  const updateSettings = (patch: Partial<UserSettings>) => {
    setState((s) => {
      const newSettings = { ...s.settings, ...patch };
      const plan = s.debts.length ? computeDebtPlan(s.debts, newSettings) : null;
      return { ...s, settings: newSettings, plan };
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
