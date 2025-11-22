// ===================================
// src/components/PayoffOrder.tsx
// ===================================
import React from "react";
import type { PlanResult, DebtInput } from "@/lib/debtPlan";
import { getPayoffOrder } from "@/lib/payoffOrder";

type Props = {
  plan: PlanResult;
  debts: DebtInput[];
};

export default function PayoffOrder({ plan, debts }: Props) {
  const order = getPayoffOrder(plan);

  if (!order.length) return null;

  // map debtId → name
  const nameMap = Object.fromEntries(debts.map((d) => [d.id, d.name]));

  return (
    <div className="p-4 border border-border/40 rounded-2xl space-y-2 max-w-md glass">
      <h2 className="text-lg font-semibold">Payoff Order</h2>
      <ol className="list-decimal list-inside space-y-1">
        {order.map((o) => (
          <li key={o.debtId}>
            <span className="font-medium">{nameMap[o.debtId] || o.debtId}</span>
            <span className="text-gray-600"> — Month {o.monthIndex}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
