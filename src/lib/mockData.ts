export const mockDebts = [
  { creditor: "Mission Lane", balance: 251.4, minPayment: 29 },
  { creditor: "Navy Fed Loan", balance: 384.57, minPayment: 45 },
  { creditor: "FinWise / AFF", balance: 1768, minPayment: 276 },
];

export const mockPlan = {
  strategy: "Snowball",
  totalMonths: 11,
  schedule: [
    { month: "Nov 2025", paid: 600, remaining: 3473.06 },
    { month: "Dec 2025", paid: 600, remaining: 2873.06 },
  ],
};
