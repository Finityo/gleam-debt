// ============================================================================
// FILE: src/engine/plan-types.ts
// ============================================================================
export type Strategy = "snowball" | "avalanche";

export type DebtInput = {
  id: string;
  name: string;
  balance: number;            // current balance
  originalBalance?: number;   // optional for UI
  apr: number;                // APR percent, e.g. 24.99
  minPayment: number;         // minimum monthly payment
  include?: boolean;          // default true
  order?: number;             // optional fixed order
  creditor?: string;          // optional UI
  dueDate?: string | null;
};

export type PlanPayment = {
  debtId: string;
  totalPaid: number;
  principal: number;
  interest: number;
  endingBalance: number;
  isClosed: boolean;
};

export type PlanMonth = {
  monthIndex: number; // 1-based
  dateISO: string | null;
  totals: {
    outflow: number;
    principal: number;
    interest: number;
  };
  snowball: number;
  payments: PlanPayment[];
};

export type PlanTotals = {
  principal: number;
  interest: number;
  outflowMonthly: number;
  monthsToDebtFree: number;
};

export type PlanResult = {
  months: PlanMonth[];
  totals: PlanTotals;
  debts: DebtInput[];
  settings: {
    strategy: Strategy;
    extraMonthly: number;
    oneTimeExtra: number;
    startDate: string;
    maxMonths: number;
  };
};
