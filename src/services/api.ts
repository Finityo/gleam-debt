import { DEMO } from "@/config/demo";
import { mockDebts, mockPlan } from "@/lib/mockData";

/** Read-only fetchers that return mock data in Demo Mode. */
export async function getDebts() {
  if (DEMO) return mockDebts;
  const res = await fetch("/api/debts", { credentials: "include" });
  return res.ok ? res.json() : Promise.reject(new Error("Failed to fetch debts"));
}

export async function getDebtPlan() {
  if (DEMO) return mockPlan;
  const res = await fetch("/api/plan", { credentials: "include" });
  return res.ok ? res.json() : Promise.reject(new Error("Failed to fetch plan"));
}

/** Optional guard for buttons that would write to the backend. */
export function demoGuard(actionName = "This action") {
  if (DEMO) {
    alert("Demo Mode: " + actionName + " is disabled in the preview.");
    return true; // handled
  }
  return false; // not handled, proceed normally
}
