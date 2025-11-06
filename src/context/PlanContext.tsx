// ===================================
// src/context/PlanContext.tsx
// ===================================
import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import {
  Debt,
  UserSettings,
  DebtPlan,
  computeDebtPlan,
  saveLocal,
  loadLocal,
  Strategy,
} from "@/lib/computeDebtPlan";

// Legacy types for backward compatibility
type DebtInput = Debt;
type PlanResult = DebtPlan & {
  strategy: Strategy;
  startDateISO: string;
  debts: Debt[];
  totals: {
    interest: number;
    principal: number;
    outflow: number;
    monthsToDebtFree: number;
    oneTimeApplied: number;
  };
};

type PlanContextType = {
  // New API
  debts: Debt[];
  settings: UserSettings;
  plan: PlanResult | null;  // Changed to use PlanResult which includes legacy properties
  updateDebts: (debts: Debt[]) => void;
  updateSettings: (next: Partial<UserSettings>) => void;
  compute: () => void;
  reset: () => void;
  
  // Legacy API (for backward compatibility)
  inputs: {
    debts: DebtInput[];
    extraMonthly: number;
    oneTimeExtra: number;
    strategy: Strategy;
    startDate?: string;
  };
  setInputs: (next: Partial<{
    debts: DebtInput[];
    extraMonthly: number;
    oneTimeExtra: number;
    strategy: Strategy;
    startDate?: string;
  }>) => void;
  resetDemo: () => void;
  loadProductionDebts: () => Promise<void>;
};

const PlanContext = createContext<PlanContextType | null>(null);

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [settings, setSettings] = useState<UserSettings>({
    extraMonthly: 0,
    oneTimeExtra: 0,
    strategy: "snowball",
  });
  const [plan, setPlan] = useState<DebtPlan | null>(null);

  // Load from localStorage
  useEffect(() => {
    const saved = loadLocal();
    if (saved) {
      setDebts(saved.debts);
      setSettings(saved.settings);
      tryCompute(saved.debts, saved.settings);
    }
  }, []);

  // Save + re-compute
  const tryCompute = (d: Debt[], s: UserSettings) => {
    try {
      const p = computeDebtPlan(d, s);
      
      // Enhance with legacy properties for backward compatibility
      const enhancedPlan = {
        ...p,
        strategy: s.strategy,
        startDateISO: new Date().toISOString().substring(0, 10),
        debts: d,
        totals: {
          interest: p.totalInterest,
          principal: p.totalPaid - p.totalInterest,
          outflow: p.totalPaid,
          monthsToDebtFree: p.summary.finalMonthIndex + 1,
          oneTimeApplied: s.oneTimeExtra,
        },
      };
      
      // Also enhance months with legacy totals
      enhancedPlan.months = p.months.map((month) => {
        const monthDate = new Date();
        monthDate.setMonth(monthDate.getMonth() + month.monthIndex);
        const dateISO = monthDate.toISOString().substring(0, 10);
        
        return {
          ...month,
          monthLabel: `Month ${month.monthIndex + 1}`,
          dateISO,
          totals: {
            interest: month.totalInterest,
            principal: month.totalPaid - month.totalInterest,
            outflow: month.totalPaid,
          },
          payments: month.payments.map(payment => ({
            ...payment,
            closedThisMonth: payment.balanceEnd <= 0.01 && payment.paid > 0,
          })),
        };
      });
      
      setPlan(enhancedPlan as any);
      saveLocal({ debts: d, settings: s });
    } catch (err) {
      console.error("❌ compute error:", err);
    }
  };

  // Public API
  const updateDebts = (nextDebts: Debt[]) => {
    setDebts(nextDebts);
    tryCompute(nextDebts, settings);
  };

  const updateSettings = (patch: Partial<UserSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    tryCompute(debts, next);
  };

  const compute = () => {
    tryCompute(debts, settings);
  };

  const reset = () => {
    setDebts([]);
    setSettings({
      extraMonthly: 0,
      oneTimeExtra: 0,
      strategy: "snowball",
    });
    setPlan(null);
    saveLocal({ debts: [], settings: {
      extraMonthly: 0,
      oneTimeExtra: 0,
      strategy: "snowball",
    }});
  };

  // Legacy API adapters
  const inputs = useMemo(() => ({
    debts,
    extraMonthly: settings.extraMonthly,
    oneTimeExtra: settings.oneTimeExtra,
    strategy: settings.strategy,
    startDate: undefined,
  }), [debts, settings]);

  const setInputs = (next: Partial<typeof inputs>) => {
    if (next.debts !== undefined) {
      setDebts(next.debts);
    }
    if (next.extraMonthly !== undefined || next.oneTimeExtra !== undefined || next.strategy !== undefined) {
      updateSettings({
        ...(next.extraMonthly !== undefined && { extraMonthly: next.extraMonthly }),
        ...(next.oneTimeExtra !== undefined && { oneTimeExtra: next.oneTimeExtra }),
        ...(next.strategy !== undefined && { strategy: next.strategy }),
      });
    }
  };

  const loadProductionDebts = async () => {
    // Placeholder for future backend integration
    console.log("loadProductionDebts not yet implemented");
  };

  return (
    <PlanContext.Provider
      value={{
        // New API
        debts,
        settings,
        plan,
        updateDebts,
        updateSettings,
        compute,
        reset,
        // Legacy API
        inputs,
        setInputs,
        resetDemo: reset,
        loadProductionDebts,
      }}
    >
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan() {
  const ctx = useContext(PlanContext);
  if (!ctx) {
    throw new Error("usePlan must be used inside <PlanProvider>");
  }
  return ctx;
}
