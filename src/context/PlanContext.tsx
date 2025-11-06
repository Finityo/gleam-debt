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

// Demo debts - matching the 5 original demo accounts
function useDemoDebts(): DebtInput[] {
  return [
    { id: "store4231", name: "Store Credit Card", balance: 850, apr: 24.99, minPayment: 35, dueDay: 15, include: true },
    { id: "personal7892", name: "Personal Loan", balance: 5200, apr: 8.5, minPayment: 185, dueDay: 1, include: true },
    { id: "auto3344", name: "Auto Loan", balance: 12500, apr: 5.9, minPayment: 320, dueDay: 10, include: true },
    { id: "visa1156", name: "Credit Card - Visa", balance: 3200, apr: 18.99, minPayment: 96, dueDay: 22, include: true },
    { id: "medical9801", name: "Medical Bill", balance: 1450, apr: 0, minPayment: 50, dueDay: 5, include: true },
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
    console.log("🚀 Computing plan with inputs:", {
      strategy: inputs.strategy,
      extraMonthly: inputs.extraMonthly,
      oneTimeExtra: inputs.oneTimeExtra,
      debtCount: inputs.debts.filter(d => d.include !== false).length
    });
    
    const res = PlanService.compute({
      debts: inputs.debts,
      extraMonthly: inputs.extraMonthly,
      oneTimeExtra: inputs.oneTimeExtra,
      strategy: inputs.strategy,
      startDate: inputs.startDate,
    });
    
    // Log Month 1 verification
    if (res.months.length > 0) {
      const month1 = res.months[0];
      console.log("✅ Month 1 Results:", {
        totalPrincipal: month1.totals.principal,
        totalInterest: month1.totals.interest,
        totalOutflow: month1.totals.outflow,
        debtsClosedThisMonth: month1.payments.filter(p => p.closedThisMonth).map(p => p.debtId)
      });
    }
    
    console.log("📈 Full Plan Summary:", {
      monthsToDebtFree: res.totals.monthsToDebtFree,
      totalInterest: res.totals.interest,
      oneTimeApplied: res.totals.oneTimeApplied
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
