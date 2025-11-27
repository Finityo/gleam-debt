/* eslint-disable */
// ============================================================================
// TEMPORARY TYPE CHECK FILE
// This file forces TypeScript to evaluate all type structures from the refactor
// ============================================================================

// ============================================================================
// ENGINE TYPES
// ============================================================================
import type {
  DebtInput,
  PlanMonth,
  PlanResult,
  Strategy,
  PlanPayment,
  PlanTotals,
} from "@/engine/plan-types";

import type { ComputeUnifiedArgs } from "@/engine/unified-engine";
import { computeDebtPlanUnified } from "@/engine/unified-engine";

// ============================================================================
// LIB DEBTPLAN
// ============================================================================
import {
  computeDebtPlan,
  PlanService,
  formatAPR,
  type ComputeParams,
  type ComputeArgs,
} from "@/lib/debtPlan";

// ============================================================================
// COMPAT LAYER
// ============================================================================
import type {
  ComputeDebtPlanSettings,
} from "@/engine/compat/compatLayer";

import type {
  LegacyPayment,
  LegacyMonth,
  LegacySummary,
  LegacyDebtPlan,
} from "@/engine/compat/legacyTypes";

// ============================================================================
// HOOKS
// ============================================================================
import { useCompareStrategies } from "@/hooks/useCompareStrategies";
import { useWhatIfPlan } from "@/hooks/useWhatIfPlan";

// ============================================================================
// CONTEXTS
// ============================================================================
import type { LivePlanContextType } from "@/contexts/PlanContext";
import { DemoPlanContext } from "@/context/DemoPlanContext";

// ============================================================================
// ENGINE HOOKS
// ============================================================================
import { useNormalizedPlan } from "@/engine/useNormalizedPlan";
import { useDebtEngine, DebtEngineProvider } from "@/engine/DebtEngineContext";
import { useDebtEngineFromStore } from "@/engine/useDebtEngineFromStore";
import { usePlanCharts } from "@/engine/usePlanCharts";
import { useUnifiedPlan } from "@/engine/useUnifiedPlan";

// ============================================================================
// LIB UTILITIES
// ============================================================================
import { comparePlans } from "@/lib/comparePlans";
import { scenarioCompare, type ScenarioSettings } from "@/lib/scenarioCompare";
import { computeMinimumOnly } from "@/lib/computeMinimumOnly";

// ============================================================================
// TYPE VALIDATION: Force TypeScript to evaluate all structures
// ============================================================================

// --- Core Plan Types ---
const testDebtInput: DebtInput = {
  id: "test",
  name: "Test Debt",
  balance: 1000,
  apr: 15,
  minPayment: 50,
  include: true,
  order: 1,
};

const testPlanPayment: PlanPayment = {
  debtId: "test",
  totalPaid: 100,
  principal: 80,
  interest: 20,
  endingBalance: 900,
  isClosed: false,
};

const testPlanMonth: PlanMonth = {
  monthIndex: 1,
  dateISO: "2025-01-01",
  totals: {
    outflow: 100,
    principal: 80,
    interest: 20,
  },
  snowball: 100,
  payments: [testPlanPayment],
};

const testPlanTotals: PlanTotals = {
  principal: 1000,
  interest: 200,
  outflowMonthly: 100,
  monthsToDebtFree: 12,
};

const testPlanResult: PlanResult = {
  months: [testPlanMonth],
  totals: testPlanTotals,
  debts: [testDebtInput],
  settings: {
    strategy: "snowball",
    extraMonthly: 50,
    oneTimeExtra: 100,
    startDate: "2025-01-01",
    maxMonths: 600,
  },
};

const testStrategy: Strategy = "snowball";

// --- Unified Engine ---
const testComputeArgs: ComputeUnifiedArgs = {
  debts: [testDebtInput],
  strategy: "avalanche",
  extraMonthly: 100,
  oneTimeExtra: 500,
  startDate: "2025-01-01",
  maxMonths: 600,
};

const unifiedResult: PlanResult = computeDebtPlanUnified(testComputeArgs);

// --- Core Compute ---
const testComputeParams: ComputeParams = {
  debts: [testDebtInput],
  strategy: "snowball",
  extraMonthly: 50,
  oneTimeExtra: 100,
  startDate: "2025-01-01",
  maxMonths: 600,
};

const computedPlan: PlanResult = computeDebtPlan(testComputeParams);
const planServiceResult: PlanResult = PlanService.compute(testComputeParams);
const aprString: string = formatAPR(15.5);

// --- Compat Layer ---
const testCompatSettings: ComputeDebtPlanSettings = {
  strategy: "avalanche",
  extraMonthly: 100,
  oneTimeExtra: 500,
  startDate: "2025-01-01",
  maxMonths: 600,
};

const testLegacyPayment: LegacyPayment = {
  paid: 100,
  interest: 20,
  principal: 80,
  balanceEnd: 900,
  totalPaid: 100,
  interestAccrued: 20,
  endingBalance: 900,
};

const testLegacyMonth: LegacyMonth = {
  payments: [testLegacyPayment],
  totalPaid: 100,
  totalInterest: 20,
  snowballPoolApplied: 100,
};

const testLegacySummary: LegacySummary = {
  firstDebtPaidMonth: 6,
  initialOutflow: 100,
  finalMonthIndex: 11,
};

const testLegacyDebtPlan: LegacyDebtPlan = {
  months: [testLegacyMonth],
  debtFreeDate: "2025-12-01",
  totalInterest: 200,
  totalPaid: 1200,
  summary: testLegacySummary,
};

// --- Scenario Compare ---
const testScenarioSettings: ScenarioSettings = {
  strategy: "snowball",
  extraMonthly: 100,
  oneTimeExtra: 500,
  startDate: "2025-01-01",
  maxMonths: 600,
};

const scenarioResults = scenarioCompare([testDebtInput], testScenarioSettings);
const snowballPlan: PlanResult = scenarioResults.snowball;
const avalanchePlan: PlanResult = scenarioResults.avalanche;
const minimumPlan: PlanResult = scenarioResults.minimum;

// --- Compare Plans ---
const comparison = comparePlans(testPlanResult, minimumPlan);
const monthsSaved: number = comparison.monthsSaved;
const interestSaved: number = comparison.interestSaved;

// --- Minimum Only ---
const minOnlyPlan: PlanResult = computeMinimumOnly([testDebtInput], {
  startDate: new Date(),
  maxMonths: 600,
});

// --- Context Types ---
const testLivePlanContext: LivePlanContextType = {
  plan: testPlanResult,
  debtsUsed: [testDebtInput],
  settingsUsed: { strategy: "snowball", extraMonthly: 0 },
  recompute: async () => {},
};

// ============================================================================
// FUNCTION SIGNATURE VALIDATION
// ============================================================================

function testHookSignatures() {
  // These calls force TypeScript to validate hook return types
  const compareResult = useCompareStrategies();
  const baselinePlan: PlanResult | null = compareResult.baselinePlan;
  const altPlan: PlanResult = compareResult.alternativePlan;
  const strategyA: Strategy | undefined = compareResult.strategyA;
  const strategyB: Strategy = compareResult.strategyB;
  
  const whatIfResult = useWhatIfPlan();
  const whatIfBaseline: PlanResult | null = whatIfResult.baselinePlan;
  const whatIfPlan: PlanResult = whatIfResult.whatIfPlan;
  const monthsDelta: number = whatIfResult.monthsDelta;
  
  const normalized = useNormalizedPlan();
  const normalizedPlan: PlanResult | null = normalized.plan;
  const normalizedMonths: PlanMonth[] = normalized.months;
  const normalizedTotals: PlanTotals = normalized.totals;
  
  const charts = usePlanCharts();
  const chartPlan: PlanResult | null = charts.plan;
  const lineSeries = charts.lineSeries;
  const pieSeries = charts.pieSeries;
  
  const unified = useUnifiedPlan();
  const unifiedPlan: PlanResult | null = unified.plan;
  const unifiedMonths: PlanMonth[] = unified.months;
  
  const engine = useDebtEngine();
  const enginePlan: PlanResult | null = engine.plan;
  const engineDebts: DebtInput[] = engine.debtsUsed;
  
  const fromStore = useDebtEngineFromStore();
  const storePlan: PlanResult | null = fromStore.plan;
  
  return {
    baselinePlan,
    altPlan,
    strategyA,
    strategyB,
    whatIfBaseline,
    whatIfPlan,
    monthsDelta,
    normalizedPlan,
    normalizedMonths,
    normalizedTotals,
    chartPlan,
    lineSeries,
    pieSeries,
    unifiedPlan,
    unifiedMonths,
    enginePlan,
    engineDebts,
    storePlan,
  };
}

// ============================================================================
// ASSIGNMENT COMPATIBILITY TESTS
// ============================================================================

// Test that PlanResult from different sources are compatible
const planA: PlanResult = testPlanResult;
const planB: PlanResult = computedPlan;
const planC: PlanResult = unifiedResult;

// Test that DebtInput is compatible across modules
const debtA: DebtInput = testDebtInput;
const debtB: DebtInput[] = [testDebtInput];

// Test that Strategy is compatible
const strat1: Strategy = "snowball";
const strat2: Strategy = "avalanche";

// Test that months/payments are compatible
const month1: PlanMonth = testPlanMonth;
const payment1: PlanPayment = testPlanPayment;
const totals1: PlanTotals = testPlanTotals;

// ============================================================================
// EXPORT VALIDATION
// ============================================================================
export type {
  DebtInput,
  PlanMonth,
  PlanResult,
  Strategy,
  PlanPayment,
  PlanTotals,
  ComputeParams,
  ComputeUnifiedArgs,
  LegacyPayment,
  LegacyDebtPlan,
  ScenarioSettings,
  LivePlanContextType,
};

export {
  computeDebtPlan,
  computeDebtPlanUnified,
  comparePlans,
  scenarioCompare,
  computeMinimumOnly,
  testHookSignatures,
};

// ============================================================================
// TYPE ASSERTION TESTS
// ============================================================================

// Verify that all fields are accessible
const verifyPlanResult = (plan: PlanResult) => {
  const months: PlanMonth[] = plan.months;
  const totals: PlanTotals = plan.totals;
  const debts: DebtInput[] = plan.debts;
  const settings = plan.settings;
  const strategy: Strategy = settings.strategy;
  const extraMonthly: number = settings.extraMonthly;
  const oneTimeExtra: number = settings.oneTimeExtra;
  const startDate: string = settings.startDate;
  const maxMonths: number = settings.maxMonths;
  
  return { months, totals, debts, strategy, extraMonthly, oneTimeExtra, startDate, maxMonths };
};

const verifyDebtInput = (debt: DebtInput) => {
  const id: string = debt.id;
  const name: string = debt.name;
  const balance: number = debt.balance;
  const apr: number = debt.apr;
  const minPayment: number = debt.minPayment;
  const include: boolean | undefined = debt.include;
  const order: number | undefined = debt.order;
  
  return { id, name, balance, apr, minPayment, include, order };
};

const verifyPlanMonth = (month: PlanMonth) => {
  const monthIndex: number = month.monthIndex;
  const dateISO: string | null = month.dateISO;
  const totals = month.totals;
  const outflow: number = totals.outflow;
  const principal: number = totals.principal;
  const interest: number = totals.interest;
  const snowball: number = month.snowball;
  const payments: PlanPayment[] = month.payments;
  
  return { monthIndex, dateISO, outflow, principal, interest, snowball, payments };
};

// Run all verifications
verifyPlanResult(testPlanResult);
verifyDebtInput(testDebtInput);
verifyPlanMonth(testPlanMonth);

console.log("✅ All type checks passed");
