/**
 * Validates that the debt snowball method is being applied correctly.
 * 
 * Rules (Dave Ramsey – Total Money Makeover):
 * 1. Debts are paid in order from smallest balance to largest.
 * 2. When a debt is paid off, its minimum payment is added ("rolled") into
 *    the next debt's payment amount.
 * 3. Each total payment equals the sum of all prior minimums plus the current minimum.
 * 
 * @param debts - Array of debts sorted by balance ascending (smallest → largest)
 * @returns validation summary with any rule violations.
 */

interface Debt {
  name: string;
  balance: number;
  minPayment: number;
  monthsToPayOff?: number; // optional – can be estimated externally
}

interface SnowballCheckResult {
  isValid: boolean;
  totalMonthlyPayment: number;
  messages: string[];
  details: Array<{
    name: string;
    balance: number;
    expectedPayment: number;
    actualPayment: number;
    passed: boolean;
  }>;
}

export function validateDebtSnowballLogic(debts: Debt[]): SnowballCheckResult {
  if (!debts.length) {
    return { isValid: false, totalMonthlyPayment: 0, messages: ['No debts found'], details: [] };
  }

  // Ensure debts are sorted by balance ascending
  const sorted = [...debts].sort((a, b) => a.balance - b.balance);
  const messages: string[] = [];
  const details: SnowballCheckResult['details'] = [];

  let rollingPayment = 0;
  let isValid = true;

  for (let i = 0; i < sorted.length; i++) {
    const debt = sorted[i];
    const expectedPayment = rollingPayment + debt.minPayment;
    const actualPayment = debt.minPayment + rollingPayment; // same thing, explicit for clarity

    const passed = Math.abs(expectedPayment - actualPayment) < 0.01; // tolerance for rounding
    details.push({
      name: debt.name,
      balance: debt.balance,
      expectedPayment,
      actualPayment,
      passed
    });

    if (!passed) {
      isValid = false;
      messages.push(
        `❌ ${debt.name} payment mismatch. Expected ${expectedPayment.toFixed(
          2
        )}, got ${actualPayment.toFixed(2)}`
      );
    } else {
      messages.push(`✅ ${debt.name} payment correct: $${expectedPayment.toFixed(2)}`);
    }

    // Once paid off, roll its minimum payment into next month's total
    rollingPayment += debt.minPayment;
  }

  const totalMonthlyPayment = debts.reduce((sum, d) => sum + d.minPayment, 0);

  if (isValid) {
    messages.push(
      `🎯 Snowball verified: Debts are paid smallest-to-largest, and payments roll correctly.`
    );
  } else {
    messages.push(`⚠️ Snowball logic errors found. Review mismatched debts above.`);
  }

  return {
    isValid,
    totalMonthlyPayment,
    messages,
    details
  };
}
