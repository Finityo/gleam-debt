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
  dueDay?: number;            // legacy compat
  category?: string;          // legacy compat
};

export type PlanPayment = {
  debtId: string;
  totalPaid: number;
  principal: number;
  interest: number;
  endingBalance: number;
  isClosed: boolean;
  // legacy compat
  balanceEnd?: number;
  interestAccrued?: number;
  startingBalance?: number;
  minApplied?: number;
  extraApplied?: number;
  closedThisMonth?: boolean;
  paid?: number;
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
  // legacy compat
  totalPaid?: number;
  totalInterest?: number;
  snowballPoolApplied?: number;
  monthLabel?: string;
};

export type PlanTotals = {
  principal: number;
  interest: number;
  outflowMonthly: number;
  monthsToDebtFree: number;
  // legacy compat
  totalPaid?: number;
  oneTimeApplied?: number;
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
  // legacy compat - duplicate strategy at root level
  strategy?: Strategy;
  summary?: string;
  totalInterest?: number;
  totalPaid?: number;
  debtFreeDate?: string;
  startDateISO?: string;
};
