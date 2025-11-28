// ============================================================================
// FILE: src/context/DemoPlanContext.tsx
// Simplified demo-only context using unified engine
// API: { demoDebts, setDemoDebts, demoPlan, reset }
// ============================================================================

import React, { createContext, useContext, useEffect, useState } from "react";
import { computeDebtPlanUnified } from "@/engine/unified-engine";
import type { DebtInput, PlanResult } from "@/engine/plan-types";

const seedDebts: DebtInput[] = [
  {
    id: "store4231",
    name: "Store Credit Card",
    balance: 850,
    apr: 24.99,
    minPayment: 35,
    dueDay: 15,
    include: true,
  },
  {
    id: "medical9801",
    name: "Medical Bill",
    balance: 450,
    apr: 0,
    minPayment: 25,
    dueDay: 5,
    include: true,
  },
  {
    id: "visa1156",
    name: "Credit Card - Visa",
    balance: 3200,
    apr: 18.99,
    minPayment: 96,
    dueDay: 22,
    include: true,
  },
  {
    id: "personal7892",
    name: "Personal Loan",
    balance: 5200,
    apr: 8.5,
    minPayment: 185,
    dueDay: 1,
    include: true,
  },
];

type DemoPlanContextType = {
  demoDebts: DebtInput[];
  setDemoDebts: React.Dispatch<React.SetStateAction<DebtInput[]>>;
  demoPlan: PlanResult | null;
  reset: () => void;
};

const DemoPlanContext = createContext<DemoPlanContextType | null>(null);

export function useDemoPlan(): DemoPlanContextType {
  const ctx = useContext(DemoPlanContext);
  if (!ctx) {
    throw new Error("useDemoPlan must be used inside DemoPlanProvider");
  }
  return ctx;
}

export function DemoPlanProvider({ children }: { children: React.ReactNode }) {
  const [demoDebts, setDemoDebts] = useState<DebtInput[]>(seedDebts);
  const [demoPlan, setDemoPlan] = useState<PlanResult | null>(null);

  useEffect(() => {
    if (!demoDebts || demoDebts.length === 0) {
      setDemoPlan(null);
      return;
    }

    const computed = computeDebtPlanUnified({
      debts: demoDebts,
      strategy: "snowball",
      extraMonthly: 200,
      oneTimeExtra: 1000,
      startDate: new Date().toISOString().slice(0, 10),
    });

    setDemoPlan(computed);
  }, [demoDebts]);

  const reset = () => {
    setDemoDebts(seedDebts);
  };

  return (
    <DemoPlanContext.Provider value={{ demoDebts, setDemoDebts, demoPlan, reset }}>
      {children}
    </DemoPlanContext.Provider>
  );
}
