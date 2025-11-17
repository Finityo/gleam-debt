// ===================================
// src/components/DashboardSummary.tsx
// ===================================
import React from "react";
import { DebtPlan } from "@/lib/computeDebtPlan";
import { getPlanSummary } from "@/lib/planSummary";

type Props = {
  plan: DebtPlan;
};

export default function DashboardSummary({ plan }: Props) {
  const summary = getPlanSummary(plan);

  if (!summary) return null;

  return (
    <div className="p-4 border border-border/40 rounded-2xl space-y-3 max-w-md glass">
      <h2 className="text-lg font-semibold">Plan Summary</h2>

      <div>
        <strong>Debt-Free Date:</strong> {summary.debtFreeDate}
      </div>

      {summary.firstDebtPaid && (
        <div>
          <strong>First Debt Paid:</strong> Month {summary.firstDebtPaid}
        </div>
      )}

      <div>
        <strong>Starting Snowball:</strong> ${summary.initialOutflow.toFixed(2)}
      </div>

      <div>
        <strong>Final Snowball:</strong> ${summary.finalSnowball.toFixed(2)}
      </div>

      <div>
        <strong>Total Interest Paid:</strong> ${summary.totalInterest.toFixed(2)}
      </div>

      <div>
        <strong>Total Paid:</strong> ${summary.totalPaid.toFixed(2)}
      </div>
    </div>
  );
}
