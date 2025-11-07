import React, { createContext, useContext, useEffect, useState } from "react";
import type { Debt, UserSettings, DebtPlan } from "@/lib/computeDebtPlan";
import { computeDebtPlan } from "@/lib/computeDebtPlan";

export type Scenario = {
  id: string;
  name: string;
  debts: Debt[];
  settings: UserSettings;
  plan: DebtPlan | null;
  updatedAt: string;
};

type ScenarioCtx = {
  scenarios: Scenario[];
  currentId: string | null;
  setCurrentId: (id: string | null) => void;
  createScenario: (name: string, debts: Debt[], settings: UserSettings) => string;
  updateScenario: (id: string, patch: Partial<Scenario>) => void;
  deleteScenario: (id: string) => void;
  computeCurrent: () => void;
  compareCurrent: () => { snowball: DebtPlan; avalanche: DebtPlan; minimum: DebtPlan } | null;
};

const ScenarioContext = createContext<ScenarioCtx>(null as any);
const LS_KEY = "finityo:scenarios";
const genId = () => Math.random().toString(36).slice(2, 10);

export function ScenarioProvider({ children }: { children: React.ReactNode }) {
  const [scenarios, setScenarios] = useState<Scenario[]>(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [currentId, setCurrentId] = useState<string | null>(scenarios[0]?.id ?? null);

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(scenarios));
    } catch (e) {
      console.error("Failed to save scenarios:", e);
    }
  }, [scenarios]);

  function createScenario(name: string, debts: Debt[], settings: UserSettings) {
    const id = genId();
    const plan = computeDebtPlan(debts, settings);
    const s: Scenario = {
      id,
      name: name.trim().slice(0, 100), // Limit length
      debts,
      settings,
      plan,
      updatedAt: new Date().toISOString(),
    };
    setScenarios((prev) => [s, ...prev]);
    setCurrentId(id);
    return id;
  }

  function updateScenario(id: string, patch: Partial<Scenario>) {
    setScenarios((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, ...patch, updatedAt: new Date().toISOString() } : s
      )
    );
  }

  function deleteScenario(id: string) {
    setScenarios((prev) => prev.filter((s) => s.id !== id));
    if (currentId === id) setCurrentId(null);
  }

  function computeCurrent() {
    const cur = scenarios.find((s) => s.id === currentId);
    if (!cur) return;
    const plan = computeDebtPlan(cur.debts, cur.settings);
    updateScenario(cur.id, { plan });
  }

  function compareCurrent() {
    const cur = scenarios.find((s) => s.id === currentId);
    if (!cur) return null;

    const snowball = computeDebtPlan(cur.debts, { ...cur.settings, strategy: "snowball" });
    const avalanche = computeDebtPlan(cur.debts, { ...cur.settings, strategy: "avalanche" });
    const minimum = computeDebtPlan(cur.debts, {
      ...cur.settings,
      extraMonthly: 0,
      oneTimeExtra: 0,
    });

    return { snowball, avalanche, minimum };
  }

  const value: ScenarioCtx = {
    scenarios,
    currentId,
    setCurrentId,
    createScenario,
    updateScenario,
    deleteScenario,
    computeCurrent,
    compareCurrent,
  };

  return <ScenarioContext.Provider value={value}>{children}</ScenarioContext.Provider>;
}

export function useScenarios() {
  const context = useContext(ScenarioContext);
  if (!context) {
    throw new Error("useScenarios must be used within ScenarioProvider");
  }
  return context;
}
