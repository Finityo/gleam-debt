import React, { createContext, useContext, useMemo, useState } from "react";
import { DebtInput, PlanResult, PlanService, Strategy } from "@/lib/debtPlan";

interface PlanInputsState {
  debts: DebtInput[];
  extraMonthly: number;
  oneTimeExtra: number;
  strategy: Strategy;
  startDate?: string;
}

interface PlanContextValue {
  inputs: PlanInputsState;
  setInputs: (next: Partial<PlanInputsState>) => void;
  plan: PlanResult | null;
  compute: () => void;
  resetDemo: () => void;
}

const PlanContext = createContext<PlanContextValue | undefined>(undefined);

// Demo debts fallback
function useDemoDebts(): DebtInput[] {
  return [
    { id: "store", name: "Store Card ****1234", balance: 420.33, apr: 23.99, minPayment: 35, dueDay: 12, include: true },
    { id: "medical", name: "Medical Bill ****7788", balance: 610.0, apr: 0, minPayment: 25, dueDay: 18, include: true },
    { id: "visa9925", name: "Navy Fed CashRewards ****9925", balance: 410.09, apr: 17.9, minPayment: 30, dueDay: 20, include: true },
    { id: "loan3668", name: "Navy Fed Loan ****3668", balance: 384.57, apr: 9.99, minPayment: 45, dueDay: 22, include: true },
  ];
}

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const [inputs, setInputsState] = useState<PlanInputsState>({
    debts: useDemoDebts(),
    extraMonthly: 200,
    oneTimeExtra: 1000,
    strategy: "snowball",
    startDate: undefined,
  });
  const [plan, setPlan] = useState<PlanResult | null>(null);

  function setInputs(next: Partial<PlanInputsState>) {
    setInputsState(prev => ({ ...prev, ...next }));
  }

  function compute() {
    const res = PlanService.compute({
      debts: inputs.debts,
      extraMonthly: inputs.extraMonthly,
      oneTimeExtra: inputs.oneTimeExtra,
      strategy: inputs.strategy,
      startDate: inputs.startDate,
    });
    setPlan(res);
  }

  function resetDemo() {
    setInputsState({
      debts: useDemoDebts(),
      extraMonthly: 200,
      oneTimeExtra: 1000,
      strategy: "snowball",
      startDate: undefined,
    });
    setPlan(null);
  }

  const value = useMemo(()=>({ inputs, setInputs, plan, compute, resetDemo }), [inputs, plan]);
  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

export function usePlan() {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error("usePlan must be used within <PlanProvider>");
  return ctx;
}
