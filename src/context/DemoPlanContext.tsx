import React, { createContext, useContext, useState } from "react";
import { type Strategy, type PlanResult, type DebtInput } from "@/lib/debtPlan";
import { DebtEngineProvider, useDebtEngine } from "@/engine/DebtEngineContext";

// Demo debts (clean set; tweak freely)
const seedDebts: DebtInput[] = [
  { id: "store4231", name: "Store Credit Card", balance: 850, apr: 24.99, minPayment: 35, dueDay: 15, include: true },
  { id: "medical9801", name: "Medical Bill", balance: 450, apr: 0, minPayment: 25, dueDay: 5, include: true },
  { id: "visa1156", name: "Credit Card - Visa", balance: 3200, apr: 18.99, minPayment: 96, dueDay: 22, include: true },
  { id: "personal7892", name: "Personal Loan", balance: 5200, apr: 8.5, minPayment: 185, dueDay: 1, include: true },
];

type Inputs = {
  debts: DebtInput[];
  extraMonthly: number;
  oneTimeExtra: number;
  strategy: Strategy;
  startDate?: string;
};

type Ctx = {
  inputs: Inputs;
  setInputs: (patch: Partial<Inputs>) => void;
  updateDebt: (id: string, patch: Partial<DebtInput>) => void;
  addDebt: () => void;
  removeDebt: (id: string) => void;
  plan: PlanResult | null;
  compute: () => void;
  reset: () => void;
};

const DemoPlanContext = createContext<Ctx | null>(null);

export function DemoPlanProvider({ children }: { children: React.ReactNode }) {
  const [inputs, setInputsState] = useState<Inputs>({
    debts: seedDebts,
    extraMonthly: 200,
    oneTimeExtra: 1000,
    strategy: "snowball",
  });

  const setInputs = (patch: Partial<Inputs>) =>
    setInputsState(prev => ({ ...prev, ...patch }));

  const updateDebt = (id: string, patch: Partial<DebtInput>) =>
    setInputsState(prev => ({
      ...prev,
      debts: prev.debts.map(d => (d.id === id ? { ...d, ...patch } : d)),
    }));

  const addDebt = () =>
    setInputsState(prev => ({
      ...prev,
      debts:
        prev.debts.length >= 5
          ? prev.debts
          : [
              ...prev.debts,
              {
                id: crypto.randomUUID(),
                name: "New Debt",
                balance: 500,
                apr: 12.99,
                minPayment: 25,
                include: true,
              } as DebtInput,
            ],
    }));

  const removeDebt = (id: string) =>
    setInputsState(prev => ({ ...prev, debts: prev.debts.filter(d => d.id !== id) }));

  const reset = () => {
    setInputsState({
      debts: seedDebts,
      extraMonthly: 200,
      oneTimeExtra: 1000,
      strategy: "snowball",
      startDate: undefined,
    });
  };

  return (
    <DebtEngineProvider
      debts={inputs.debts}
      settings={{
        strategy: inputs.strategy,
        extraMonthly: inputs.extraMonthly,
        oneTimeExtra: inputs.oneTimeExtra,
        startDate: inputs.startDate,
      }}
    >
      <DemoPlanInner
        inputs={inputs}
        setInputs={setInputs}
        updateDebt={updateDebt}
        addDebt={addDebt}
        removeDebt={removeDebt}
        reset={reset}
      >
        {children}
      </DemoPlanInner>
    </DebtEngineProvider>
  );
}

function DemoPlanInner({
  inputs,
  setInputs,
  updateDebt,
  addDebt,
  removeDebt,
  reset,
  children,
}: any) {
  const { plan } = useDebtEngine();

  const compute = () => {
    // Plan is auto-computed by engine, just log
    console.log("✅ DEMO PLAN", plan?.totals);
  };

  const value = {
    inputs,
    setInputs,
    updateDebt,
    addDebt,
    removeDebt,
    plan,
    compute,
    reset,
  };

  return <DemoPlanContext.Provider value={value}>{children}</DemoPlanContext.Provider>;
}

export function useDemoPlan() {
  const ctx = useContext(DemoPlanContext);
  if (!ctx) throw new Error("useDemoPlan must be used inside DemoPlanProvider");
  return ctx;
}
