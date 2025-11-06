import { DEMO } from "@/lib/config";
import { mockDebts, getMockPlan } from "@/lib/mockData";

/**
 * API layer - Always returns fresh computation in demo mode
 */
export async function getDebts() {
  if (DEMO) return mockDebts;
  const res = await fetch("/api/debts");
  return res.json();
}

export async function getDebtPlan() {
  if (DEMO) {
    // Always get fresh computation - no caching
    return getMockPlan();
  }
  const res = await fetch("/api/plan");
  return res.json();
}
