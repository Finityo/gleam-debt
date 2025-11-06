// ===============================================
// Demo Computation Test & Verification
// ===============================================
import { computeDebtPlan, DebtInput } from "@/lib/debtPlan";

/**
 * Test the demo computation with the exact parameters
 * This runs the live engine and logs detailed results
 */
export function testDemoComputation() {
  console.log("🧪 ===== DEMO COMPUTATION TEST =====");
  
  const testDebts: DebtInput[] = [
    { id: "store4231", name: "Store Credit Card", balance: 850, apr: 24.99, minPayment: 35, dueDay: 15, include: true },
    { id: "personal7892", name: "Personal Loan", balance: 5200, apr: 8.5, minPayment: 185, dueDay: 1, include: true },
    { id: "auto3344", name: "Auto Loan", balance: 12500, apr: 5.9, minPayment: 320, dueDay: 10, include: true },
    { id: "visa1156", name: "Credit Card - Visa", balance: 3200, apr: 18.99, minPayment: 96, dueDay: 22, include: true },
    { id: "medical9801", name: "Medical Bill", balance: 1450, apr: 0, minPayment: 50, dueDay: 5, include: true },
  ];

  console.log("📋 Input Debts (Snowball Order - Smallest Balance First):");
  const sortedByBalance = [...testDebts].sort((a, b) => a.balance - b.balance);
  sortedByBalance.forEach((d, i) => {
    console.log(`  ${i + 1}. ${d.name}: $${d.balance} @ ${d.apr}% APR (Min: $${d.minPayment})`);
  });

  const result = computeDebtPlan({
    debts: testDebts,
    strategy: "snowball",
    extraMonthly: 200,
    oneTimeExtra: 1000,
  });

  console.log("\n💰 Plan Summary:");
  console.log(`  Strategy: ${result.strategy}`);
  console.log(`  Months to Debt-Free: ${result.totals.monthsToDebtFree}`);
  console.log(`  Total Interest: $${result.totals.interest.toFixed(2)}`);
  console.log(`  One-Time Applied (Month 1): $${result.totals.oneTimeApplied.toFixed(2)}`);
  console.log(`  Monthly Outflow: $${result.totals.outflowMonthly.toFixed(2)}`);

  // Detailed Month 1 Analysis
  if (result.months.length > 0) {
    const month1 = result.months[0];
    console.log("\n🎯 MONTH 1 DETAILED BREAKDOWN:");
    console.log(`  Date: ${month1.monthLabel}`);
    console.log(`  Total Principal Paid: $${month1.totals.principal.toFixed(2)}`);
    console.log(`  Total Interest Accrued: $${month1.totals.interest.toFixed(2)}`);
    console.log(`  Total Outflow: $${month1.totals.outflow.toFixed(2)}`);

    console.log("\n  Per-Debt Breakdown:");
    month1.payments.forEach((payment) => {
      const debt = testDebts.find(d => d.id === payment.debtId);
      console.log(`\n  📌 ${debt?.name} (${payment.debtId}):`);
      console.log(`     Starting Balance: $${payment.startingBalance.toFixed(2)}`);
      console.log(`     Interest Accrued: $${payment.interestAccrued.toFixed(2)}`);
      console.log(`     Min Payment: $${payment.minApplied.toFixed(2)}`);
      console.log(`     Extra Applied: $${payment.extraApplied.toFixed(2)}`);
      console.log(`     Total Paid: $${payment.totalPaid.toFixed(2)}`);
      console.log(`     Ending Balance: $${payment.endingBalance.toFixed(2)}`);
      console.log(`     ✅ CLOSED: ${payment.closedThisMonth ? "YES" : "NO"}`);
    });

    const closedDebts = month1.payments.filter(p => p.closedThisMonth);
    if (closedDebts.length > 0) {
      console.log("\n  🎉 Debts Closed in Month 1:");
      closedDebts.forEach(p => {
        const debt = testDebts.find(d => d.id === p.debtId);
        console.log(`     ✅ ${debt?.name} - Paid in Full!`);
      });
    }
  }

  // Month 2 Preview (to verify cascade)
  if (result.months.length > 1) {
    const month2 = result.months[1];
    console.log("\n📅 MONTH 2 PREVIEW (Cascade Verification):");
    console.log(`  Total Principal Paid: $${month2.totals.principal.toFixed(2)}`);
    console.log(`  Total Interest Accrued: $${month2.totals.interest.toFixed(2)}`);
    
    const closedInMonth2 = month2.payments.filter(p => p.closedThisMonth);
    if (closedInMonth2.length > 0) {
      console.log("  🎉 Debts Closed in Month 2:");
      closedInMonth2.forEach(p => {
        const debt = testDebts.find(d => d.id === p.debtId);
        console.log(`     ✅ ${debt?.name} - Paid in Full!`);
      });
    }
  }

  console.log("\n🏁 ===== TEST COMPLETE =====\n");

  return result;
}

// Run test immediately when imported in dev
if (import.meta.env.DEV) {
  // Uncomment to run test on module load:
  // testDemoComputation();
}
