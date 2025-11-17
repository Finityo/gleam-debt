// ===================================
// src/components/DebtDrawer.tsx
// ===================================
import React from "react";
import { Debt } from "@/lib/computeDebtPlan";

type Props = {
  open: boolean;
  onClose: () => void;
  debt: any | null;
};

export default function DebtDrawer({ open, onClose, debt }: Props) {
  if (!open || !debt) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="absolute right-0 top-0 h-full w-80 glass border-l border-border/40 shadow-lg p-4 overflow-y-auto"
      >
        <h2 className="text-lg font-semibold mb-3">{debt.name}</h2>

        <div className="space-y-2 text-sm">
          <div>
            <strong>Balance:</strong> ${debt.balance.toFixed(2)}
          </div>
          <div>
            <strong>APR:</strong> {debt.apr}%
          </div>
          <div>
            <strong>Min Payment:</strong> ${debt.minPayment.toFixed(2)}
          </div>
          {debt.category && (
            <div>
              <strong>Category:</strong> {debt.category}
            </div>
          )}
          {debt.payoffMonth != null && (
            <div>
              <strong>Payoff Month:</strong> {debt.payoffMonth + 1}
            </div>
          )}
          <div>
            <strong>Total Interest Paid:</strong> $
            {debt.interestPaid.toFixed(2)}
          </div>
          <div>
            <strong>Total Principal Paid:</strong> $
            {debt.principalPaid.toFixed(2)}
          </div>
        </div>

        <button
          className="mt-6 px-3 py-2 border rounded text-sm"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
}
