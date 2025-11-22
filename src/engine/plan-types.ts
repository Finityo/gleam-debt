// ============================================================
// src/engine/plan-types.ts
// Core shared plan types for engine + unified plan
// ============================================================

export type DebtInput = {
  id: string;
  name: string;
  balance: number;
  apr: number;
  minPayment: number;
  order?: number;
  include?: boolean;
  included?: boolean;
};

export type PlanMonth = {
  monthIndex: number;
  dateISO: string | null;
  totals: {
    principal: number;
    interest: number;
    outflow: number;
  };
  snowball: number;
  payments: Array<{
    debtId: string;
    totalPaid: number;
    principal: number;
    interest: number;
    endingBalance: number;
    isClosed: boolean;
  }>;
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
  settings: any;
};
