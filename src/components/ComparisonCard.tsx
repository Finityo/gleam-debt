// ===================================
// src/components/ComparisonCard.tsx
// ===================================
import React from "react";
import { DebtPlan } from "@/lib/computeDebtPlan";
import { comparePlans } from "@/lib/comparePlans";

type Props = {
  plan: DebtPlan;
  minOnlyPlan: DebtPlan;
};

export default function ComparisonCard({ plan, minOnlyPlan }: Props) {
  const c = comparePlans(plan, minOnlyPlan);

  return (
    <div className="p-4 border rounded max-w-md bg-white space-y-2">
      <h2 className="text-lg font-semibold">Plan Comparison</h2>

      <div><strong>Debt-Free (Plan):</strong> {c.debtFreeDateReal}</div>
      <div><strong>Debt-Free (Min Only):</strong> {c.debtFreeDateMin}</div>
      <div><strong>Months Saved:</strong> {c.monthsSaved}</div>

      <div><strong>Total Interest (Plan):</strong> ${c.interestReal.toFixed(2)}</div>
      <div><strong>Total Interest (Min Only):</strong> ${c.interestMin.toFixed(2)}</div>

      <div className="text-green-700 font-semibold">
        Interest Saved: ${c.interestSaved.toFixed(2)}
      </div>
    </div>
  );
}
