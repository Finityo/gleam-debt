import { DEMO, mockDebts, mockPlan } from "@/config/demo";

export async function getDebts() {
  if (DEMO) return mockDebts;
  const res = await fetch("/api/debts");
  return res.json();
}

export async function getDebtPlan() {
  if (DEMO) return mockPlan;
  const res = await fetch("/api/plan");
  return res.json();
}
