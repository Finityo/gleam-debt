// ===================================
// src/context/PlanContext.tsx
// ===================================
import React, { createContext, useContext, useEffect, useState } from "react";
import {
  Debt,
  UserSettings,
  DebtPlan,
  computeDebtPlan,
  saveLocal,
  loadLocal,
} from "@/lib/computeDebtPlan";

type PlanContextType = {
  debts: Debt[];
  settings: UserSettings;
  plan: DebtPlan | null;
  notes: string;
  setDebts: React.Dispatch<React.SetStateAction<Debt[]>>;
  setSettings: React.Dispatch<React.SetStateAction<UserSettings>>;
  setPlan: React.Dispatch<React.SetStateAction<DebtPlan | null>>;
  setNotes: React.Dispatch<React.SetStateAction<string>>;
  updateDebts: (debts: Debt[]) => void;
  updateSettings: (next: Partial<UserSettings>) => void;
  compute: () => void;
  reset: () => void;
};

const PlanContext = createContext<PlanContextType | null>(null);

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [settings, setSettings] = useState<UserSettings>({
    extraMonthly: 0,
    oneTimeExtra: 0,
    strategy: "snowball",
  });
  const [plan, setPlan] = useState<DebtPlan | null>(null);
  const [notes, setNotes] = useState<string>("");

  // Load from localStorage
  useEffect(() => {
    const saved = loadLocal();
    if (saved) {
      setDebts(saved.debts);
      setSettings(saved.settings);
      tryCompute(saved.debts, saved.settings);
    }
    const savedNotes = localStorage.getItem("finityo:notes");
    if (savedNotes !== null) setNotes(savedNotes);
  }, []);

  // Persist notes to localStorage
  useEffect(() => {
    localStorage.setItem("finityo:notes", notes);
  }, [notes]);

  // Save + re-compute
  const tryCompute = (d: Debt[], s: UserSettings) => {
    try {
      const p = computeDebtPlan(d, s);
      setPlan(p);
      saveLocal({ debts: d, settings: s });
    } catch (err) {
      console.error("❌ compute error:", err);
    }
  };

  // Public API
  const updateDebts = (nextDebts: Debt[]) => {
    setDebts(nextDebts);
    tryCompute(nextDebts, settings);
  };

  const updateSettings = (patch: Partial<UserSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    tryCompute(debts, next);
  };

  const compute = () => {
    tryCompute(debts, settings);
  };

  const reset = () => {
    setDebts([]);
    setSettings({
      extraMonthly: 0,
      oneTimeExtra: 0,
      strategy: "snowball",
    });
    setPlan(null);
    saveLocal({ debts: [], settings: {
      extraMonthly: 0,
      oneTimeExtra: 0,
      strategy: "snowball",
    }});
  };

  return (
    <PlanContext.Provider
      value={{
        debts,
        settings,
        plan,
        notes,
        setDebts,
        setSettings,
        setPlan,
        setNotes,
        updateDebts,
        updateSettings,
        compute,
        reset,
      }}
    >
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan() {
  const ctx = useContext(PlanContext);
  if (!ctx) {
    throw new Error("usePlan must be used inside <PlanProvider>");
  }
  return ctx;
}
