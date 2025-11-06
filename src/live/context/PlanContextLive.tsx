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
      // Import Supabase client
      const { supabase } = await import("@/integrations/supabase/client");

      // Fetch debts from edge function
      const { data: debts, error: debtsError } = await supabase.functions.invoke('get-debts');
      
      if (debtsError) {
        console.error("❌ Failed to fetch debts:", debtsError);
        throw debtsError;
      }

      // Fetch settings from edge function
      const { data: settings, error: settingsError } = await supabase.functions.invoke('get-settings');
      
      if (settingsError) {
        console.error("❌ Failed to fetch settings:", settingsError);
        throw settingsError;
      }

      setInputsState({
        debts: debts || [],
        extraMonthly: settings?.extraMonthly ?? 0,
        oneTimeExtra: settings?.oneTimeExtra ?? 0,
        strategy: settings?.strategy ?? "snowball",
        startDate: settings?.startDate,
      });
      
      console.log("✅ Live debts and settings loaded from Lovable Cloud:", {
        debtCount: debts?.length || 0,
        settings
      });
    } catch (err) {
      console.error("❌ Failed to load live data:", err);
    }
  }

  function compute() {
    if (!inputs.debts?.length) {
      console.warn("⚠️ No debts found in live context.");
      return;
    }
    const result = PlanService.compute(inputs);
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
