// ============================================================
// src/hooks/useEngine.ts
// Fetches from Lovable Cloud + wraps computeDebtPlanUnified()
// ============================================================

import { useContext } from "react";
import { LivePlanContext } from "@/contexts/PlanContext";

export function useEngine() {
  const ctx = useContext(LivePlanContext);
  if (!ctx) throw new Error("useEngine must be used inside LivePlanProvider");

  return ctx;
}
