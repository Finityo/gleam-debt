// ===================================
// src/components/MinimumComparison.tsx
// ===================================
import React from "react";
import { Debt, DebtPlan, UserSettings } from "@/lib/computeDebtPlan";
import { computeMinimumOnly } from "@/lib/computeMinimumOnly";
import { comparePlans } from "@/lib/comparePlans";

type Props = {
  debts: Debt[];
  plan: DebtPlan;
};

export default function MinimumComparison({ debts, plan }: Props) {
  // Compute minimum-only scenario
  const minOnlyPlan = computeMinimumOnly(debts);
  const comparison = comparePlans(plan, minOnlyPlan);

  return (
    <div className="p-4 border rounded space-y-3 max-w-md bg-white">
      <h2 className="text-lg font-semibold">Snowball vs. Minimum-Only</h2>

      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-600">Your Strategy:</span>
          <span className="font-medium">{comparison.monthsReal} months</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600">Minimum-Only:</span>
          <span className="font-medium">{comparison.monthsMin} months</span>
        </div>

        <div className="flex justify-between border-t pt-2">
          <span className="font-semibold text-green-700">Months Saved:</span>
          <span className="font-semibold text-green-700">
            {comparison.monthsSaved} months
          </span>
        </div>
      </div>

      <div className="space-y-2 pt-2 border-t">
        <div className="flex justify-between">
          <span className="text-gray-600">Your Interest:</span>
          <span className="font-medium">${comparison.interestReal.toFixed(2)}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600">Minimum Interest:</span>
          <span className="font-medium">${comparison.interestMin.toFixed(2)}</span>
        </div>

        <div className="flex justify-between border-t pt-2">
          <span className="font-semibold text-green-700">Interest Saved:</span>
          <span className="font-semibold text-green-700">
            ${comparison.interestSaved.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="space-y-1 pt-2 border-t text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Debt-Free (Your Plan):</span>
          <span className="font-medium">{comparison.debtFreeDateReal}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600">Debt-Free (Min-Only):</span>
          <span className="font-medium">{comparison.debtFreeDateMin}</span>
        </div>
      </div>
    </div>
  );
}
