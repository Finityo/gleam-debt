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
  refreshFromBackend: () => Promise<void>;
}

const PlanContextLive = createContext<PlanContextValue | undefined>(undefined);

export function PlanProviderLive({ children }: { children: React.ReactNode }) {
  const [inputs, setInputsState] = useState<PlanInputsState>({
    debts: [],
    extraMonthly: 0,
    oneTimeExtra: 0,
    strategy: "snowball",
    startDate: undefined,
  });
  const [plan, setPlan] = useState<PlanResult | null>(null);

  function setInputs(next: Partial<PlanInputsState>) {
    setInputsState(prev => ({ ...prev, ...next }));
  }

  async function refreshFromBackend() {
    try {
      // Using local API files
      const { getDebts } = await import("../api/debts");
      const { getSettings } = await import("../api/settings");
      
      const data = await getDebts();
      const cfg = await getSettings();

      setInputsState({
        debts: data,
        extraMonthly: cfg.extraMonthly ?? 0,
        oneTimeExtra: cfg.oneTimeExtra ?? 0,
        strategy: cfg.strategy ?? "snowball",
        startDate: cfg.startDate,
      });
      console.log("✅ Live debts and settings loaded from local API.");
    } catch (err) {
      console.error("❌ Failed to load live data:", err);
    }
  }

  function compute() {
    if (!inputs.debts?.length) {
      console.warn("⚠️ No debts found in live context.");
      return;
    }
    const result = PlanService.compute({
      ...inputs,
      startDate: inputs.startDate || new Date().toISOString().slice(0, 10),
    });
    console.log("📊 Live plan computed:", result.totals);
    setPlan(result);
  }

  const value = useMemo(
    () => ({ inputs, setInputs, plan, compute, refreshFromBackend }),
    [inputs, plan]
  );

  return <PlanContextLive.Provider value={value}>{children}</PlanContextLive.Provider>;
}

export function usePlanLive() {
  const ctx = useContext(PlanContextLive);
  if (!ctx) throw new Error("usePlanLive must be used within <PlanProviderLive>");
  return ctx;
}
