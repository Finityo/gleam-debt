// ==========================================================
//  FINITYO CORE ENGINE TEST PACK
//  Validates fundamental debt payoff math
//  Ensures unified engine, legacy engine, and compat layer
//  all produce consistent, correct results.
// ==========================================================

import { describe, test, expect } from "vitest";

import {
  computeDebtPlanUnified,
  type ComputeUnifiedArgs,
} from "@/engine/unified-engine";

import {
  computeDebtPlan as legacyCompute,
} from "@/lib/debtPlan";

import {
  computeDebtPlan as computeDebtPlanCompat,
} from "@/engine/compat/compatLayer";

import type {
  DebtInput,
  PlanResult,
} from "@/engine/plan-types";

// Helper: deep numeric compare with tolerance
function num(a: number, b: number, tolerance = 0.01) {
  return Math.abs(a - b) <= tolerance;
}

// SAMPLE TEST DATA — small, predictable, no assumptions
const sampleDebts: DebtInput[] = [
  {
    id: "1",
    name: "Visa",
    balance: 1000,
    apr: 20,
    minPayment: 50,
    include: true,
  },
  {
    id: "2",
    name: "Loan",
    balance: 2000,
    apr: 10,
    minPayment: 75,
    include: true,
  },
];

const baseArgs: ComputeUnifiedArgs = {
  debts: sampleDebts,
  strategy: "snowball",
  extraMonthly: 0,
  oneTimeExtra: 0,
  startDate: "2024-01-01",
  maxMonths: 480,
};

// Helper: safely compute plan
function safeCompute(args: ComputeUnifiedArgs): PlanResult {
  const plan = computeDebtPlanUnified(args);
  if (!plan || !plan.months) {
    throw new Error("Plan engine returned invalid result");
  }
  return plan;
}

// ==========================================================
//  TEST SUITE
// ==========================================================
describe("Finityo Core Engine – Math Validation", () => {
  
  test("Engine returns valid plan structure", () => {
    const plan = safeCompute(baseArgs);

    expect(plan.months.length).toBeGreaterThan(0);
    expect(plan.totals.monthsToDebtFree).toBeGreaterThan(0);
    expect(plan.debts.length).toBe(2);
  });

  test("Monthly interest accrues correctly", () => {
    const plan = safeCompute(baseArgs);
    const firstMonth = plan.months[0];
    const visa = firstMonth.payments.find(p => p.debtId === "1");

    // Expected monthly interest for Visa: (1000 * 0.20) / 12 = 16.66
    const expectedInterest = (1000 * 0.20) / 12;

    expect(num(visa!.interestAccrued, expectedInterest)).toBe(true);
  });

  test("Minimum payments reduce principal correctly", () => {
    const plan = safeCompute(baseArgs);
    const first = plan.months[0];

    const visa = first.payments.find(p => p.debtId === "1");
    const loan = first.payments.find(p => p.debtId === "2");

    // Visa min payment: 50 → principal = 50 - interest
    const visaInterest = (1000 * 0.20) / 12;
    const expectedVisaPrincipal = 50 - visaInterest;

    expect(num(visa!.totalPaid - visa!.interestAccrued, expectedVisaPrincipal)).toBe(true);
    expect(visa!.endingBalance).toBeCloseTo(1000 - expectedVisaPrincipal, 2);

    // Loan min payment: 75 → principal = 75 - interest
    const loanInterest = (2000 * 0.10) / 12;
    const expectedLoanPrincipal = 75 - loanInterest;

    expect(num(loan!.totalPaid - loan!.interestAccrued, expectedLoanPrincipal)).toBe(true);
  });

  test("Snowball strategy orders debts correctly", () => {
    const plan = safeCompute(baseArgs);

    const ordered = plan.debts
      .slice()
      .sort((a, b) => (a.balance ?? 0) - (b.balance ?? 0));

    expect(plan.debts[0].id).toBe(ordered[0].id);
  });

  test("Legacy engine matches unified engine", () => {
    const unified = computeDebtPlanUnified(baseArgs);
    const legacy = legacyCompute({
      debts: sampleDebts,
      strategy: "snowball",
      extraMonthly: 0,
      oneTimeExtra: 0,
      startDate: "2024-01-01",
      maxMonths: 480,
    });

    expect(legacy.months.length).toBe(unified.months.length);
    expect(num(legacy.totals.totalPaid, unified.totals.totalPaid)).toBe(true);
  });

  test("Compat layer matches unified engine for base case", () => {
    const unified = computeDebtPlanUnified(baseArgs);
    const compat = computeDebtPlanCompat(sampleDebts, {
      strategy: "snowball",
      extraMonthly: 0,
      oneTimeExtra: 0,
      startDate: "2024-01-01",
      maxMonths: 480,
    });

    expect(compat.months.length).toBe(unified.months.length);
    expect(num(compat.totals.interest, unified.totals.interest)).toBe(true);
  });
});
