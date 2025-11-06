import React, { createContext, useContext, useMemo, useState } from "react";
import { DebtInput, PlanResult, PlanService, Strategy } from "@/lib/debtPlan";

// --- ENV MODE SWITCH: demo vs production ---
const isDemo = import.meta.env.MODE !== "production"; // demo for dev & preview; prod uses real data

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
  loadProductionDebts: () => Promise<void>;
}

const PlanContext = createContext<PlanContextValue | undefined>(undefined);

function demoDebts(): DebtInput[] {
  return [
    { id: "store4231", name: "Store Credit Card", balance: 850, apr: 24.99, minPayment: 35, dueDay: 15, include: true },
    { id: "personal7892", name: "Personal Loan", balance: 5200, apr: 8.5, minPayment: 185, dueDay: 1, include: true },
    { id: "auto3344", name: "Auto Loan", balance: 12500, apr: 5.9, minPayment: 320, dueDay: 10, include: true },
    { id: "visa1156", name: "Credit Card - Visa", balance: 3200, apr: 18.99, minPayment: 96, dueDay: 22, include: true },
    { id: "medical9801", name: "Medical Bill", balance: 1450, apr: 0, minPayment: 50, dueDay: 5, include: true }
  ];
}

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const [inputs, setInputsState] = useState<PlanInputsState>({
    debts: isDemo ? demoDebts() : [],
    extraMonthly: 200,
    oneTimeExtra: 1000,
    strategy: "snowball",
    startDate: undefined
  });
  const [plan, setPlan] = useState<PlanResult | null>(null);

  function setInputs(next: Partial<PlanInputsState>) {
    setInputsState(prev => ({ ...prev, ...next }));
  }

  async function loadProductionDebts() {
    try {
      // TODO: Replace with your Lovable Cloud fetch (read-only)
      // Example endpoint name: /api/debts or cloud function
      // const res = await fetch("/api/debts");
      // const data: DebtInput[] = await res.json();
      const data: DebtInput[] = []; // placeholder so it doesn't crash if API isn't wired yet
      setInputsState(prev => ({ ...prev, debts: data }));
    } catch (e) {
      console.error("Failed to load production debts:", e);
    }
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
      startDate: inputs.startDate
    });

    // Console verification (Month 1)
    if (res.months.length > 0) {
      const m1 = res.months[0];
      const closed = m1.payments.filter(p => p.closedThisMonth);
      const allMins = inputs.debts.filter(d => d.include !== false).reduce((s, d) => s + d.minPayment, 0);

      console.log("┌─────────────────────────────────────────────────────");
      console.log("│ ✅ FINITYO ENGINE VERIFICATION - MONTH 1");
      console.log("├─────────────────────────────────────────────────────");
      console.log(`│ All Minimums: $${allMins.toFixed(2)} + Extra: $${inputs.extraMonthly.toFixed(2)} + One-Time: $${inputs.oneTimeExtra.toFixed(2)}`);
      console.log(`│ Principal: $${m1.totals.principal.toFixed(2)}  Interest: $${m1.totals.interest.toFixed(2)}  Outflow: $${m1.totals.outflow.toFixed(2)}`);
      console.log(`│ Debts Closed: ${closed.length}`);
      closed.forEach(p => {
        const debt = inputs.debts.find(d => d.id === p.debtId);
        console.log(`│   ✅ ${debt?.name} ($${p.totalPaid.toFixed(2)} paid)`);
      });
      console.log("└─────────────────────────────────────────────────────");
    }

    console.log("📈 Plan Summary:", {
      monthsToDebtFree: res.totals.monthsToDebtFree,
      totalInterest: res.totals.interest,
      oneTimeApplied: res.totals.oneTimeApplied
    });

    setPlan(res);
  }

  function resetDemo() {
    setInputsState({
      debts: demoDebts(),
      extraMonthly: 200,
      oneTimeExtra: 1000,
      strategy: "snowball",
      startDate: undefined
    });
    setPlan(null);
  }

  const value = useMemo(
    () => ({ inputs, setInputs, plan, compute, resetDemo, loadProductionDebts }),
    [inputs, plan]
  );

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

export function usePlan() {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error("usePlan must be used within <PlanProvider>");
  return ctx;
}
