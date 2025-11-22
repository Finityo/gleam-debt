// ============================================================
// src/contexts/PlanContext.ts
// Provides live engine state to the entire app
// ============================================================

import { createContext } from "react";
import { PlanResult, DebtInput } from "@/engine/plan-types";

export type LivePlanContextType = {
  plan: PlanResult | null;
  debtsUsed: DebtInput[];
  settingsUsed: any;
  recompute: () => Promise<void>;
};

export const LivePlanContext = createContext<LivePlanContextType | null>(null);
