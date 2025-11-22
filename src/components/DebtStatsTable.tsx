// ===================================
// src/components/DebtStatsTable.tsx
// ===================================
import React, { useState } from "react";
import type { PlanResult, DebtInput } from "@/lib/debtPlan";
import { getDebtStats } from "@/lib/debtStats";
import DebtDrawer from "./DebtDrawer";
import { Card } from "./ui/card";

type Props = {
  plan: PlanResult;
  debts: DebtInput[];
};

export default function DebtStatsTable({ plan, debts }: Props) {
  const [selectedDebt, setSelectedDebt] = useState<any | null>(null);
  const stats = getDebtStats(plan, debts);

  return (
    <>
      <Card className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left p-3">Debt</th>
              <th className="text-right p-3">Balance</th>
              <th className="text-right p-3">APR</th>
              <th className="text-right p-3">Payoff Month</th>
              <th className="text-right p-3">Interest Paid</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((d) => (
              <tr
                key={d.id}
                className="cursor-pointer hover:bg-muted/50 border-b"
                onClick={() => setSelectedDebt(d)}
              >
                <td className="p-3">{d.name}</td>
                <td className="text-right p-3">${d.balance.toFixed(2)}</td>
                <td className="text-right p-3">{d.apr}%</td>
                <td className="text-right p-3">
                  {d.payoffMonth != null ? d.payoffMonth + 1 : "—"}
                </td>
                <td className="text-right p-3">${d.interestPaid.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <DebtDrawer
        open={!!selectedDebt}
        onClose={() => setSelectedDebt(null)}
        debt={selectedDebt}
      />
    </>
  );
}
