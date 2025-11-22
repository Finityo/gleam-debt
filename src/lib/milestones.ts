// ===================================
// src/lib/milestones.ts
// ===================================
import type { PlanResult } from "@/lib/debtPlan";
import { remainingByMonth } from "@/lib/remaining";

export type Milestone = {
  label: string;
  monthIndex: number; // 0-based
  dateStr: string;
  remaining: number;
};

export function getMilestones(plan: PlanResult): Milestone[] {
  if (!plan || !plan.months.length) return [];

  const remaining = remainingByMonth(plan);

  // total at start
  const initialTotal = remaining[0].remaining;

  const checkpoints = [
    { label: "First Payoff", fn: (m: any) => null }, // handled below
    { label: "75% Remaining", pct: 0.75 },
    { label: "50% Remaining", pct: 0.50 },
    { label: "25% Remaining", pct: 0.25 },
  ];

  const out: Milestone[] = [];

  // --- First Debt Paid ---
  // Find first month where at least one debt reaches 0 balance
  let firstMonth: number | null = null;
  for (let i = 0; i < plan.months.length; i++) {
    const hasPayoff = plan.months[i].payments.some(p => p.endingBalance <= 0);
    if (hasPayoff) {
      firstMonth = i;
      break;
    }
  }

  if (firstMonth != null) {
    out.push({
      label: "First Debt Paid",
      monthIndex: firstMonth,
      dateStr: plan.months[firstMonth]?.dateISO ?? "",
      remaining: remaining[firstMonth]?.remaining ?? 0,
    });
  }

  // --- Remaining % checkpoints ---
  for (const cp of checkpoints) {
    if (!cp.pct) continue;
    const target = initialTotal * cp.pct;

    const hit = remaining.find((r) => r.remaining <= target);
    if (!hit) continue;

    const m = plan.months[hit.monthIndex];
    if (!m) continue;

    out.push({
      label: cp.label,
      monthIndex: hit.monthIndex,
      dateStr: m.dateISO,
      remaining: hit.remaining,
    });
  }

  // --- Final payoff ---
  const finalIdx = plan.months.length - 1;
  if (finalIdx >= 0) {
    out.push({
      label: "Debt-Free!",
      monthIndex: finalIdx,
      dateStr: plan.months[finalIdx]?.dateISO ?? "",
      remaining: 0,
    });
  }

  // sort by monthIndex
  return out.sort((a, b) => a.monthIndex - b.monthIndex);
}
