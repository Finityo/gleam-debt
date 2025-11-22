export interface LegacyPayment {
  paid?: number;
  interest?: number;
  principal?: number;
  balanceEnd?: number;

  // from new engine
  totalPaid?: number;
  interestAccrued?: number;
  endingBalance?: number;
}

export interface LegacyMonth {
  payments: LegacyPayment[];
  totalPaid?: number;
  totalInterest?: number;
  snowballPoolApplied?: number;
}

export interface LegacySummary {
  firstDebtPaidMonth: number | null;
  initialOutflow: number;
  finalMonthIndex: number;
}

export interface LegacyDebtPlan {
  months: LegacyMonth[];
  debtFreeDate?: string;
  totalInterest?: number;
  totalPaid?: number;
  summary?: LegacySummary;

  // passthrough new engine fields
  totals?: any;
  strategy?: string;
}
