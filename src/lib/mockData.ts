export const mockDebts = [
  { 
    name: "Store Credit Card", 
    last4: "4231",
    balance: 850, 
    minPayment: 35, 
    apr: 24.99,
    dueDate: "15",
    debtType: "credit_card",
    notes: "High APR - prioritize in avalanche method"
  },
  { 
    name: "Personal Loan", 
    last4: "7892",
    balance: 5200, 
    minPayment: 185, 
    apr: 8.5,
    dueDate: "1",
    debtType: "personal",
    notes: "Fixed rate personal loan"
  },
  { 
    name: "Auto Loan", 
    last4: "3344",
    balance: 12500, 
    minPayment: 320, 
    apr: 5.9,
    dueDate: "10",
    debtType: "auto",
    notes: "Vehicle financing"
  },
  { 
    name: "Credit Card - Visa", 
    last4: "1156",
    balance: 3200, 
    minPayment: 96, 
    apr: 18.99,
    dueDate: "22",
    debtType: "credit_card",
    notes: "Main credit card"
  },
  { 
    name: "Medical Bill", 
    last4: "9801",
    balance: 1450, 
    minPayment: 50, 
    apr: 0,
    dueDate: "5",
    debtType: "medical",
    notes: "0% interest payment plan"
  },
];

export const mockPlan = {
  strategy: "Snowball",
  totalMonths: 11,
  schedule: [
    { month: "Nov 2025", paid: 600, remaining: 3473.06 },
    { month: "Dec 2025", paid: 600, remaining: 2873.06 },
  ],
};
