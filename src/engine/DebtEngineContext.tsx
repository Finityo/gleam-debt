import React, { createContext, useContext, useMemo } from "react";
import { computeDebtPlan, type PlanResult, type DebtInput, type Strategy } from "@/lib/debtPlan";

/**
 * DebtEngineContext
 * Single source of truth for all payoff math.
 */

export type DebtEngineSettings = {
  strategy?: Strategy;
  extraMonthly?: number;
  oneTimeExtra?: number;
  startDate?: string;
  maxMonths?: number;
};

export type DebtEngineInput = {
  debts: DebtInput[];
  settings: DebtEngineSettings;
  overrideDebts?: DebtInput[] | null;
  overrideSettings?: Partial<DebtEngineSettings> | null;
};

type DebtEngineValue = {
  plan: PlanResult | null;
  debtsUsed: DebtInput[];
  settingsUsed: DebtEngineSettings;
};

const DebtEngineContext = createContext<DebtEngineValue | null>(null);

export function DebtEngineProvider({
  debts,
  settings,
  overrideDebts = null,
  overrideSettings = null,
  children,
}: React.PropsWithChildren<DebtEngineInput>) {
  const debtsUsed = overrideDebts ?? debts ?? [];
  const settingsUsed: DebtEngineSettings = {
    strategy: "snowball",
    extraMonthly: 0,
    oneTimeExtra: 0,
    ...settings,
    ...(overrideSettings ?? {}),
  };

  const plan = useMemo(() => {
    if (!debtsUsed.length) return null;
    
    return computeDebtPlan({
      debts: debtsUsed,
      strategy: settingsUsed.strategy || "snowball",
      extraMonthly: Number(settingsUsed.extraMonthly || 0),
      oneTimeExtra: Number(settingsUsed.oneTimeExtra || 0),
      startDate: settingsUsed.startDate,
      maxMonths: settingsUsed.maxMonths,
    });
  }, [
    debtsUsed,
    settingsUsed.strategy,
    settingsUsed.extraMonthly,
    settingsUsed.oneTimeExtra,
    settingsUsed.startDate,
    settingsUsed.maxMonths,
  ]);

  const value = useMemo(
    () => ({ plan, debtsUsed, settingsUsed }),
    [plan, debtsUsed, settingsUsed]
  );

  return (
    <DebtEngineContext.Provider value={value}>
      {children}
    </DebtEngineContext.Provider>
  );
}

export function useDebtEngine() {
  const ctx = useContext(DebtEngineContext);
  if (!ctx) {
    throw new Error(
      "useDebtEngine must be used within a DebtEngineProvider."
    );
  }
  return ctx;
}
