// ============================================================================
// COMPREHENSIVE TYPE CHECK FILE
// Forces TypeScript to validate all refactored types structurally
// ============================================================================

// =============================================================================
// CORE ENGINE TYPES
// =============================================================================
import type {
  DebtInput,
  PlanMonth,
  PlanResult,
  Strategy,
  PlanPayment,
  PlanTotals,
} from "@/engine/plan-types";

import type {
  DebtInput as DebtInputLib,
  PlanMonth as PlanMonthLib,
  PlanResult as PlanResultLib,
  Strategy as StrategyLib,
  PlanPayment as PlanPaymentLib,
  PlanTotals as PlanTotalsLib,
  ComputeParams,
} from "@/lib/debtPlan";

import { computeDebtPlan } from "@/lib/debtPlan";

// =============================================================================
// UNIFIED ENGINE
// =============================================================================
import type { ComputeUnifiedArgs } from "@/engine/unified-engine";
import { computeDebtPlanUnified } from "@/engine/unified-engine";

// =============================================================================
// COMPATIBILITY LAYER
// =============================================================================
import type {
  LegacyPayment,
  LegacyMonth,
  LegacySummary,
  LegacyDebtPlan,
} from "@/engine/compat/legacyTypes";

import type { ComputeDebtPlanSettings } from "@/engine/compat/compatLayer";
import { computeDebtPlan as computeCompat } from "@/engine/compat/compatLayer";

// =============================================================================
// LEGACY COMPUTE WRAPPER
// =============================================================================
import type {
  Debt,
  Scenario,
  UserSettings,
  DebtPlan,
  PlanResult as LegacyPlanResult,
} from "@/lib/computeDebtPlan";
import { computeDebtPlan as computeLegacy } from "@/lib/computeDebtPlan";

// =============================================================================
// MINIMUM ONLY COMPUTATION
// =============================================================================
import { computeMinimumOnly } from "@/lib/computeMinimumOnly";

// =============================================================================
// PLAN COMPARISON
// =============================================================================
import { comparePlans } from "@/lib/comparePlans";

// =============================================================================
// SCENARIO COMPARISON
// =============================================================================
import type { ScenarioSettings } from "@/lib/scenarioCompare";
import { scenarioCompare } from "@/lib/scenarioCompare";

// =============================================================================
// HOOKS
// =============================================================================
import { useCompareStrategies } from "@/hooks/useCompareStrategies";
import { useWhatIfPlan } from "@/hooks/useWhatIfPlan";

// =============================================================================
// CONTEXTS
// =============================================================================
import type { LivePlanContextType } from "@/contexts/PlanContext";
import { LivePlanContext } from "@/contexts/PlanContext";

// =============================================================================
// ENGINE CONTEXT
// =============================================================================
import { useDebtEngine, DebtEngineProvider } from "@/engine/DebtEngineContext";
import { useNormalizedPlan } from "@/engine/useNormalizedPlan";
import { usePlanCharts } from "@/engine/usePlanCharts";
import { useUnifiedPlan } from "@/engine/useUnifiedPlan";

// =============================================================================
// LIVE CONTEXT
// =============================================================================
import { usePlanLive } from "@/live/context/PlanContextLive";

// =============================================================================
// TYPE ASSIGNMENTS - ENGINE TYPES
// =============================================================================

const testDebtInput: DebtInput = {
  id: "test-1",
  name: "Test Debt",
  balance: 5000,
  apr: 15.99,
  minPayment: 100,
};

const testDebtInputLib: DebtInputLib = {
  id: "test-2",
  name: "Test Debt Lib",
  balance: 3000,
  apr: 12.5,
  minPayment: 75,
};

const testStrategy: Strategy = "snowball";
const testStrategyLib: StrategyLib = "avalanche";

const testPlanPayment: PlanPayment = {
  debtId: "test-1",
  totalPaid: 150,
  interest: 50,
  principal: 100,
  endingBalance: 4900,
  isClosed: false,
  // legacy compat
  interestAccrued: 50,
  paid: 150,
};

const testPlanPaymentLib: PlanPaymentLib = {
  debtId: "test-1",
  totalPaid: 150,
  interest: 50,
  principal: 100,
  endingBalance: 4900,
  isClosed: false,
  // legacy compat
  interestAccrued: 50,
  paid: 150,
};

const testPlanMonth: PlanMonth = {
  monthIndex: 0,
  dateISO: "2024-01-01",
  snowball: 50,
  payments: [testPlanPayment],
  totals: {
    outflow: 150,
    interest: 50,
    principal: 100,
  },
};

const testPlanMonthLib: PlanMonthLib = {
  monthIndex: 0,
  dateISO: "2024-01-01",
  snowball: 50,
  payments: [testPlanPaymentLib],
  totals: {
    outflow: 150,
    interest: 50,
    principal: 100,
  },
};

const testPlanTotals: PlanTotals = {
  principal: 4500,
  interest: 500,
  outflowMonthly: 150,
  monthsToDebtFree: 36,
  // legacy compat
  totalPaid: 5000,
};

const testPlanTotalsLib: PlanTotalsLib = {
  principal: 4500,
  interest: 500,
  outflowMonthly: 150,
  monthsToDebtFree: 36,
  // legacy compat
  totalPaid: 5000,
};

const testPlanResult: PlanResult = {
  months: [testPlanMonth],
  totals: testPlanTotals,
  debts: [testDebtInput],
  settings: {
    strategy: "snowball",
    extraMonthly: 50,
    oneTimeExtra: 0,
    startDate: "2024-01-01",
    maxMonths: 600,
  },
  // legacy compat
  startDateISO: "2024-01-01",
  strategy: "snowball",
};

const testPlanResultLib: PlanResultLib = {
  months: [testPlanMonthLib],
  totals: testPlanTotalsLib,
  debts: [testDebtInputLib],
  settings: {
    strategy: "avalanche",
    extraMonthly: 100,
    oneTimeExtra: 500,
    startDate: "2024-01-01",
    maxMonths: 600,
  },
  // legacy compat
  startDateISO: "2024-01-01",
  strategy: "avalanche",
};

// =============================================================================
// COMPATIBILITY LAYER TYPES
// =============================================================================

const testLegacyPayment: LegacyPayment = {
  paid: 150,
  interest: 50,
  principal: 100,
  balanceEnd: 4900,
  totalPaid: 150,
  interestAccrued: 50,
  endingBalance: 4900,
};

const testLegacyMonth: LegacyMonth = {
  payments: [testLegacyPayment],
  totalPaid: 150,
  totalInterest: 50,
  snowballPoolApplied: 150,
};

const testLegacySummary: LegacySummary = {
  firstDebtPaidMonth: 12,
  initialOutflow: 150,
  finalMonthIndex: 35,
};

const testLegacyDebtPlan: LegacyDebtPlan = {
  months: [testLegacyMonth],
  debtFreeDate: "2027-01-01",
  totalInterest: 500,
  totalPaid: 5000,
  summary: testLegacySummary,
  totals: testPlanTotals,
  strategy: "snowball",
};

// =============================================================================
// COMPUTE FUNCTION CALLS - FORCE TYPE VALIDATION
// =============================================================================

// Test unified engine computation
const testComputeArgs: ComputeUnifiedArgs = {
  debts: [testDebtInput],
  strategy: "snowball",
  extraMonthly: 50,
  oneTimeExtra: 0,
  startDate: "2024-01-01",
  maxMonths: 600,
};

const computedPlanUnified: PlanResult = computeDebtPlanUnified(testComputeArgs);

// Test core library computation
const testComputeParams: ComputeParams = {
  debts: [testDebtInputLib],
  strategy: "avalanche",
  extraMonthly: 100,
  oneTimeExtra: 500,
  startDate: "2024-01-01",
  maxMonths: 600,
};

const computedPlanLib: PlanResultLib = computeDebtPlan(testComputeParams);

// Test compatibility layer computation
const testCompatSettings: ComputeDebtPlanSettings = {
  strategy: "snowball",
  extraMonthly: 50,
  oneTimeExtra: 0,
  startDate: "2024-01-01",
  maxMonths: 600,
};

const computedPlanCompat: LegacyDebtPlan = computeCompat(
  [testDebtInput],
  testCompatSettings
);

// Test legacy wrapper computation
const testUserSettings: UserSettings = {
  strategy: "avalanche",
  extraMonthly: 75,
  oneTimeExtra: 250,
  startDate: "2024-02-01",
  maxMonths: 480,
};

const computedPlanLegacy: LegacyPlanResult = computeLegacy({
  debts: [testDebtInput],
  strategy: testUserSettings.strategy || "snowball",
  extraMonthly: testUserSettings.extraMonthly || 0,
  oneTimeExtra: testUserSettings.oneTimeExtra || 0,
  startDate: testUserSettings.startDate || new Date().toISOString().slice(0, 10),
  maxMonths: testUserSettings.maxMonths,
});

// Test minimum-only computation
const computedMinOnly: PlanResultLib = computeMinimumOnly([testDebtInputLib], {
  startDate: new Date("2024-01-01"),
  maxMonths: 600,
});

// Test plan comparison
const comparisonResult = comparePlans(computedPlanUnified, computedMinOnly);

// Validate comparison result structure
const monthsReal: number = comparisonResult.monthsReal;
const monthsMin: number = comparisonResult.monthsMin;
const monthsSaved: number = comparisonResult.monthsSaved;
const interestReal: number = comparisonResult.interestReal;
const interestMin: number = comparisonResult.interestMin;
const interestSaved: number = comparisonResult.interestSaved;
const debtFreeDateReal: string = comparisonResult.debtFreeDateReal;
const debtFreeDateMin: string = comparisonResult.debtFreeDateMin;

// Test scenario comparison
const testScenarioSettings: ScenarioSettings = {
  strategy: "snowball",
  startDate: "2024-01-01",
  extraMonthly: 100,
  oneTimeExtra: 500,
  maxMonths: 600,
};

const scenarioComparisonResult = scenarioCompare(
  [testDebtInput],
  testScenarioSettings
);

// =============================================================================
// HOOK SIGNATURES - VALIDATE RETURN TYPES
// =============================================================================

function testHookSignatures() {
  // Test useCompareStrategies
  const compareResult = useCompareStrategies();
  const baselinePlan: PlanResult | null = compareResult.baselinePlan;
  const alternativePlan: PlanResult = compareResult.alternativePlan;
  const strategyA = compareResult.strategyA;
  const strategyB = compareResult.strategyB;
  const monthsSavedCompare: number = compareResult.monthsSaved;
  const interestSavedCompare: number = compareResult.interestSaved;

  // Test useWhatIfPlan
  const whatIfResult = useWhatIfPlan();
  const whatIfBaseline: PlanResult | null = whatIfResult.baselinePlan;
  const whatIfPlan: PlanResult = whatIfResult.whatIfPlan;
  const whatIfSettings = whatIfResult.whatIf;
  const setWhatIf = whatIfResult.setWhatIf;
  const monthsDelta: number = whatIfResult.monthsDelta;
  const interestDelta: number = whatIfResult.interestDelta;

  // Test useDebtEngine
  const engineResult = useDebtEngine();
  const enginePlan: PlanResult | null = engineResult.plan;
  const engineDebts: DebtInput[] = engineResult.debtsUsed;
  const engineSettings = engineResult.settingsUsed;

  // Test useNormalizedPlan
  const normalizedResult = useNormalizedPlan();
  const normalizedPlan: PlanResult | null = normalizedResult.plan;
  const normalizedDebts: DebtInput[] = normalizedResult.debtsUsed;
  const normalizedSettings = normalizedResult.settingsUsed;

  // Test usePlanCharts
  const chartsResult = usePlanCharts();
  const chartsPlan: PlanResult | null = chartsResult.plan;
  const chartsDebts: DebtInput[] = chartsResult.debtsUsed;
  const chartsSettings = chartsResult.settingsUsed;

  // Test useUnifiedPlan
  const unifiedResult = useUnifiedPlan();
  const unifiedPlan: PlanResult | null = unifiedResult.plan;
  const unifiedDebts: DebtInput[] = unifiedResult.debtsUsed;
  const unifiedSettings = unifiedResult.settingsUsed;

  // Test usePlanLive
  const liveResult = usePlanLive();
  const liveInputs = liveResult.inputs;
  const liveSetInputs = liveResult.setInputs;
  const livePlan: PlanResult | null = liveResult.plan;
  const liveCompute = liveResult.compute;
  const liveRefresh = liveResult.refreshFromBackend;

  return {
    compareResult,
    whatIfResult,
    engineResult,
    normalizedResult,
    chartsResult,
    unifiedResult,
    liveResult,
  };
}

// =============================================================================
// CONTEXT SIGNATURES - VALIDATE VALUE TYPES
// =============================================================================

function testContextSignatures() {
  // Test LivePlanContext
  const livePlanContextValue: LivePlanContextType = {
    plan: testPlanResult,
    debtsUsed: [testDebtInput],
    settingsUsed: {
      strategy: "snowball",
      extraMonthly: 50,
      oneTimeExtra: 0,
      startDate: "2024-01-01",
    },
    recompute: async () => {},
  };

  return { livePlanContextValue };
}

// =============================================================================
// TYPE COMPATIBILITY ASSERTIONS
// =============================================================================

// Verify DebtInput compatibility
const debtInputCompatTest: DebtInput = testDebtInputLib;
const debtInputLibCompatTest: DebtInputLib = testDebtInput;

// Verify PlanMonth compatibility
const planMonthCompatTest: PlanMonth = testPlanMonthLib;
const planMonthLibCompatTest: PlanMonthLib = testPlanMonth;

// Verify PlanResult compatibility
const planResultCompatTest: PlanResult = testPlanResultLib;
const planResultLibCompatTest: PlanResultLib = testPlanResult;

// Verify Strategy compatibility
const strategyCompatTest: Strategy = testStrategyLib;
const strategyLibCompatTest: StrategyLib = testStrategy;

// Verify PlanPayment compatibility
const planPaymentCompatTest: PlanPayment = testPlanPaymentLib;
const planPaymentLibCompatTest: PlanPaymentLib = testPlanPayment;

// Verify PlanTotals compatibility
const planTotalsCompatTest: PlanTotals = testPlanTotalsLib;
const planTotalsLibCompatTest: PlanTotalsLib = testPlanTotals;

// =============================================================================
// EXPORT VALIDATION
// =============================================================================

export {
  testDebtInput,
  testPlanResult,
  testComputeArgs,
  computedPlanUnified,
  computedPlanLib,
  computedPlanCompat,
  computedPlanLegacy,
  computedMinOnly,
  comparisonResult,
  scenarioComparisonResult,
  testHookSignatures,
  testContextSignatures,
};

// =============================================================================
// TYPE ASSERTIONS - VERIFY FIELD ACCESS
// =============================================================================

function verifyPlanResult(plan: PlanResult) {
  const months = plan.months;
  const totals = plan.totals;
  const startDate = plan.startDateISO;
  const strategy = plan.strategy;
  const settings = plan.settings;

  const firstMonth = months[0];
  if (firstMonth) {
    const monthIndex = firstMonth.monthIndex;
    const dateISO = firstMonth.dateISO;
    const payments = firstMonth.payments;
    const monthTotals = firstMonth.totals;
  }

  const totalPaid = totals.totalPaid;
  const interest = totals.interest;
  const principal = totals.principal;
  const monthsToDebtFree = totals.monthsToDebtFree;
  const outflowMonthly = totals.outflowMonthly;

  return { months, totals, startDate, strategy, settings };
}

function verifyDebtInput(debt: DebtInput) {
  const id = debt.id;
  const name = debt.name;
  const balance = debt.balance;
  const apr = debt.apr;
  const minPayment = debt.minPayment;

  return { id, name, balance, apr, minPayment };
}

function verifyPlanMonth(month: PlanMonth) {
  const monthIndex = month.monthIndex;
  const dateISO = month.dateISO;
  const snowball = month.snowball;
  const payments = month.payments;
  const totals = month.totals;

  const firstPayment = payments[0];
  if (firstPayment) {
    const debtId = firstPayment.debtId;
    const totalPaid = firstPayment.totalPaid;
    const interest = firstPayment.interest;
    const principal = firstPayment.principal;
    const endingBalance = firstPayment.endingBalance;
    const isClosed = firstPayment.isClosed;
    // legacy compat
    const interestAccrued = firstPayment.interestAccrued;
    const paid = firstPayment.paid;
  }

  return { monthIndex, dateISO, snowball, payments, totals };
}

// Execute verifications
verifyPlanResult(computedPlanUnified);
verifyDebtInput(testDebtInput);
verifyPlanMonth(testPlanMonth);

console.log("✅ All type checks passed successfully");
