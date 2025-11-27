import React, { createContext, useContext, useEffect, useState } from "react";
import type { Debt, UserSettings, DebtPlan } from "@/lib/computeDebtPlan";
import { computeDebtPlanUnified } from "@/engine/unified-engine";
import type { DebtInput } from "@/engine/plan-types";
import { computeMinimumOnly } from "@/lib/computeMinimumOnly";
import { DebtEngineProvider, useDebtEngine } from "@/engine/DebtEngineContext";

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

function comparePlans(debts: Debt[], base: UserSettings): { snowball: DebtPlan; avalanche: DebtPlan; minimum: DebtPlan } {
  const snowball = computeDebtPlanUnified({
    debts: debts as DebtInput[],
    strategy: "snowball",
    extraMonthly: base.extraMonthly || 0,
    oneTimeExtra: base.oneTimeExtra || 0,
    startDate: base.startDate || new Date().toISOString().slice(0, 10),
    maxMonths: base.maxMonths,
  });
  const avalanche = computeDebtPlanUnified({
    debts: debts as DebtInput[],
    strategy: "avalanche",
    extraMonthly: base.extraMonthly || 0,
    oneTimeExtra: base.oneTimeExtra || 0,
    startDate: base.startDate || new Date().toISOString().slice(0, 10),
    maxMonths: base.maxMonths,
  });
  const minimum = computeMinimumOnly(debts);
  return { snowball, avalanche, minimum };
}

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
    const plan = computeDebtPlanUnified({
      debts: debts as DebtInput[],
      strategy: settings.strategy || "snowball",
      extraMonthly: settings.extraMonthly || 0,
      oneTimeExtra: settings.oneTimeExtra || 0,
      startDate: settings.startDate || new Date().toISOString().slice(0, 10),
      maxMonths: settings.maxMonths,
    });
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
    const plan = computeDebtPlanUnified({
      debts: cur.debts as DebtInput[],
      strategy: cur.settings.strategy || "snowball",
      extraMonthly: cur.settings.extraMonthly || 0,
      oneTimeExtra: cur.settings.oneTimeExtra || 0,
      startDate: cur.settings.startDate || new Date().toISOString().slice(0, 10),
      maxMonths: cur.settings.maxMonths,
    });
    updateScenario(cur.id, { plan });
  }

  function compareCurrent() {
    const cur = scenarios.find((s) => s.id === currentId);
    if (!cur) return null;
    return comparePlans(cur.debts, cur.settings);
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
