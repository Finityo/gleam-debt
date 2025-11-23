// ============================================================================
// FILE: src/engine/DebtEngineContext.tsx
// ============================================================================
import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { DebtInput, PlanResult, Strategy } from "@/engine/plan-types";
import { computeDebtPlanUnified } from "@/engine/unified-engine";
import { toNum } from "@/lib/number";

// Re-export toNum for convenience
export { toNum };

type EngineSettings = {
  strategy: Strategy;
  extraMonthly: number;
  oneTimeExtra: number;
  startDate: string;
  maxMonths: number;
};

type DebtEngineCtx = {
  debtsUsed: DebtInput[];
  settingsUsed: EngineSettings;
  plan: PlanResult | null;
  setDebts: (debts: DebtInput[]) => void;
  updateDebt: (id: string, patch: Partial<DebtInput>) => void;
  addDebt: (seed?: Partial<DebtInput>) => void;
  removeDebt: (id: string) => void;
  setSettings: (patch: Partial<EngineSettings>) => void;
  recompute: () => void;
  reset: () => void;
};

const DebtEngineContext = createContext<DebtEngineCtx | null>(null);

export function DebtEngineProvider({
  children,
  initialDebts = [],
  initialSettings,
}: {
  children: React.ReactNode;
  initialDebts?: DebtInput[];
  initialSettings?: Partial<EngineSettings>;
}) {
  const [debts, setDebtsState] = useState<DebtInput[]>(initialDebts);
  const [settings, setSettingsState] = useState<EngineSettings>({
    strategy: "snowball",
    extraMonthly: 0,
    oneTimeExtra: 0,
    startDate: new Date().toISOString().slice(0, 10),
    maxMonths: 600,
    ...(initialSettings ?? {}),
  });

  const recompute = useCallback(() => {
    // trigger memo recalculation by shallow cloning
    setDebtsState(d => [...d]);
  }, []);

  const plan = useMemo<PlanResult | null>(() => {
    if (!debts?.length) return null;
    return computeDebtPlanUnified({
      debts,
      strategy: settings.strategy,
      extraMonthly: settings.extraMonthly,
      oneTimeExtra: settings.oneTimeExtra,
      startDate: settings.startDate,
      maxMonths: settings.maxMonths,
    });
  }, [debts, settings]);

  const setDebts = useCallback((next: DebtInput[]) => {
    setDebtsState(next.map((d, i) => ({
      ...d,
      id: d.id ?? String(i),
      balance: toNum(d.balance),
      apr: toNum(d.apr),
      minPayment: toNum(d.minPayment),
      include: d.include !== false,
      order: toNum(d.order, i + 1),
    })));
  }, []);

  const updateDebt = useCallback((id: string, patch: Partial<DebtInput>) => {
    setDebtsState(prev =>
      prev.map(d => (d.id === id ? { ...d, ...patch } : d))
    );
  }, []);

  const addDebt = useCallback((seed?: Partial<DebtInput>) => {
    setDebtsState(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: "New Debt",
        balance: 0,
        apr: 0,
        minPayment: 0,
        include: true,
        order: prev.length + 1,
        ...(seed ?? {}),
      },
    ]);
  }, []);

  const removeDebt = useCallback((id: string) => {
    setDebtsState(prev => prev.filter(d => d.id !== id));
  }, []);

  const setSettings = useCallback((patch: Partial<EngineSettings>) => {
    setSettingsState(prev => ({ ...prev, ...patch }));
  }, []);

  const reset = useCallback(() => {
    setDebtsState([]);
    setSettingsState(prev => ({
      ...prev,
      extraMonthly: 0,
      oneTimeExtra: 0,
      strategy: "snowball",
    }));
  }, []);

  const value: DebtEngineCtx = {
    debtsUsed: debts,
    settingsUsed: settings,
    plan,
    setDebts,
    updateDebt,
    addDebt,
    removeDebt,
    setSettings,
    recompute,
    reset,
  };

  return (
    <DebtEngineContext.Provider value={value}>
      {children}
    </DebtEngineContext.Provider>
  );
}

export function useDebtEngine() {
  const ctx = useContext(DebtEngineContext);
  if (!ctx) throw new Error("useDebtEngine must be used within DebtEngineProvider");
  return ctx;
}
