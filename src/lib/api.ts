import { DEMO } from "@/lib/config";
import { mockDebts, getMockPlan } from "@/lib/mockData";

export async function getDebts() {
  if (DEMO) return mockDebts;
  const res = await fetch("/api/debts");
  return res.json();
}

export async function getDebtPlan() {
  if (DEMO) return getMockPlan();
  const res = await fetch("/api/plan");
  return res.json();
}
