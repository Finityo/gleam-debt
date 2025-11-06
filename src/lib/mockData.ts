// ===============================================
// Demo Data - NO CACHING - Always Fresh Computation
// ===============================================
import { computeDebtPlan, DebtInput } from "./debtPlan";

export const mockDebts = [
  { 
    id: "store4231",
    name: "Store Credit Card", 
    last4: "4231",
    balance: 850, 
    minPayment: 35, 
    apr: 24.99,
    dueDay: 15,
    dueDate: "15",
    debtType: "credit_card",
    notes: "High APR - prioritize in avalanche method"
  },
  { 
    id: "personal7892",
    name: "Personal Loan", 
    last4: "7892",
    balance: 5200, 
    minPayment: 185, 
    apr: 8.5,
    dueDay: 1,
    dueDate: "1",
    debtType: "personal",
    notes: "Fixed rate personal loan"
  },
  { 
    id: "auto3344",
    name: "Auto Loan", 
    last4: "3344",
    balance: 12500, 
    minPayment: 320, 
    apr: 5.9,
    dueDay: 10,
    dueDate: "10",
    debtType: "auto",
    notes: "Vehicle financing"
  },
  { 
    id: "visa1156",
    name: "Credit Card - Visa", 
    last4: "1156",
    balance: 3200, 
    minPayment: 96, 
    apr: 18.99,
    dueDay: 22,
    dueDate: "22",
    debtType: "credit_card",
    notes: "Main credit card"
  },
  { 
    id: "medical9801",
    name: "Medical Bill", 
    last4: "9801",
    balance: 1450, 
    minPayment: 50, 
    apr: 0,
    dueDay: 5,
    dueDate: "5",
    debtType: "medical",
    notes: "0% interest payment plan"
  },
];

// Convert mockDebts to DebtInput format for the engine
const demoDebtsForEngine: DebtInput[] = mockDebts.map(d => ({
  id: d.id,
  name: d.name,
  balance: d.balance,
  apr: d.apr,
  minPayment: d.minPayment,
  dueDay: d.dueDay,
  include: true,
}));

/**
 * ALWAYS compute fresh - NO CACHING
 * This ensures the latest engine logic is used every time
 */
export function getMockPlan() {
  console.log("🔄 Computing fresh demo plan with live engine...");
  const result = computeDebtPlan({
    debts: demoDebtsForEngine,
    strategy: "snowball",
    extraMonthly: 200,
    oneTimeExtra: 1000,
  });
  
  // Log Month 1 details for verification
  if (result.months.length > 0) {
    const month1 = result.months[0];
    console.log("📊 Month 1 Computation:", {
      totalPrincipal: month1.totals.principal,
      totalInterest: month1.totals.interest,
      payments: month1.payments.map(p => ({
        debt: p.debtId,
        starting: p.startingBalance,
        paid: p.totalPaid,
        ending: p.endingBalance,
        closed: p.closedThisMonth
      }))
    });
  }
  
  return result;
}

// NO CACHED EXPORT - Always call getMockPlan() for fresh computation
export const mockPlan = getMockPlan();
