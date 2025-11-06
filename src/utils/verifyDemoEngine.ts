// ===============================================
// Immediate Demo Engine Verification
// Auto-runs on import to verify computation
// ===============================================
import { computeDebtPlan, DebtInput } from "@/lib/debtPlan";

const DEMO_DEBTS: DebtInput[] = [
  { id: "store4231", name: "Store Credit Card", balance: 850, apr: 24.99, minPayment: 35, dueDay: 15, include: true },
  { id: "personal7892", name: "Personal Loan", balance: 5200, apr: 8.5, minPayment: 185, dueDay: 1, include: true },
  { id: "auto3344", name: "Auto Loan", balance: 12500, apr: 5.9, minPayment: 320, dueDay: 10, include: true },
  { id: "visa1156", name: "Credit Card - Visa", balance: 3200, apr: 18.99, minPayment: 96, dueDay: 22, include: true },
  { id: "medical9801", name: "Medical Bill", balance: 1450, apr: 0, minPayment: 50, dueDay: 5, include: true },
];

console.log("🔍 ===== FINITYO DEMO ENGINE VERIFICATION =====");
console.log("📝 Testing with 5 demo debts:");
console.log("   • Store Credit Card: $850 @ 24.99% APR");
console.log("   • Personal Loan: $5,200 @ 8.5% APR");
console.log("   • Auto Loan: $12,500 @ 5.9% APR");
console.log("   • Credit Card - Visa: $3,200 @ 18.99% APR");
console.log("   • Medical Bill: $1,450 @ 0% APR");
console.log("\n💰 Parameters:");
console.log("   • Strategy: Snowball (smallest balance first)");
console.log("   • Extra Monthly: $200");
console.log("   • One-Time Payment: $1,000 (Month 1)");

const result = computeDebtPlan({
  debts: DEMO_DEBTS,
  strategy: "snowball",
  extraMonthly: 200,
  oneTimeExtra: 1000,
});

console.log("\n✅ COMPUTATION COMPLETE");
console.log("📊 Overall Results:");
console.log(`   • Months to Debt-Free: ${result.totals.monthsToDebtFree}`);
console.log(`   • Total Interest: $${result.totals.interest.toFixed(2)}`);
console.log(`   • One-Time Applied: $${result.totals.oneTimeApplied.toFixed(2)}`);

if (result.months.length > 0) {
  const m1 = result.months[0];
  console.log("\n🎯 MONTH 1 BREAKDOWN:");
  console.log(`   • Principal Paid: $${m1.totals.principal.toFixed(2)}`);
  console.log(`   • Interest Accrued: $${m1.totals.interest.toFixed(2)}`);
  console.log(`   • Total Outflow: $${m1.totals.outflow.toFixed(2)}`);
  
  const closed = m1.payments.filter(p => p.closedThisMonth);
  if (closed.length > 0) {
    console.log("\n   🎉 DEBTS CLOSED IN MONTH 1:");
    closed.forEach(p => {
      const debt = DEMO_DEBTS.find(d => d.id === p.debtId);
      console.log(`      ✅ ${debt?.name} - PAID IN FULL ($${p.totalPaid.toFixed(2)} paid)`);
    });
  } else {
    console.log("\n   ⚠️ WARNING: No debts closed in Month 1!");
  }

  console.log("\n   📋 Per-Debt Details:");
  m1.payments.forEach(p => {
    const debt = DEMO_DEBTS.find(d => d.id === p.debtId);
    console.log(`      ${debt?.name}:`);
    console.log(`         Start: $${p.startingBalance.toFixed(2)} → End: $${p.endingBalance.toFixed(2)}`);
    console.log(`         Paid: $${p.totalPaid.toFixed(2)} (Min: $${p.minApplied.toFixed(2)}, Extra: $${p.extraApplied.toFixed(2)})`);
  });
}

if (result.months.length > 1) {
  const m2 = result.months[1];
  console.log("\n📅 MONTH 2 PREVIEW (Cascade Verification):");
  console.log(`   • Principal Paid: $${m2.totals.principal.toFixed(2)}`);
  
  const closed2 = m2.payments.filter(p => p.closedThisMonth);
  if (closed2.length > 0) {
    console.log("   🎉 Debts Closed in Month 2:");
    closed2.forEach(p => {
      const debt = DEMO_DEBTS.find(d => d.id === p.debtId);
      console.log(`      ✅ ${debt?.name} - PAID IN FULL`);
    });
  }
}

console.log("\n🏁 ===== VERIFICATION COMPLETE =====\n");

export { result as verificationResult };
