// ===================================
// src/components/JournalTimeline.tsx
// ===================================
import React from "react";
import { DebtPlan, Debt } from "@/lib/computeDebtPlan";
import { buildJournal } from "@/lib/journal";

type Props = {
  plan: DebtPlan;
  debts: Debt[];
};

export default function JournalTimeline({ plan, debts }: Props) {
  const journal = buildJournal(plan, debts);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Month-by-Month Journal</h2>

      {journal.map((entry) => (
        <div
          key={entry.monthIndex}
          className="p-4 border rounded bg-white space-y-2"
        >
          <div className="font-semibold">
            Month {entry.monthIndex + 1}
          </div>

          <div className="text-sm text-gray-700">
            Pool: ${entry.pool.toFixed(2)}
          </div>

          <div className="text-sm text-gray-700">
            Remaining: ${entry.remaining.toFixed(2)}
          </div>

          {!!entry.payoffs.length && (
            <div className="pt-2 space-y-1">
              <div className="text-sm font-medium">Paid Off:</div>
              {entry.payoffs.map((p) => (
                <div
                  key={p.debtId}
                  className="text-sm pl-3"
                >
                  • {p.debtName} (${p.principal.toFixed(2)})
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
