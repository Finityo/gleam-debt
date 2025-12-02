// src/engine/runPlanEngine.ts
// Centralized, audited, and guarded entry point for ALL engine calls.
// Only PG_PLAN is allowed to use this. Everyone else is illegal by design.

import { finityoSafetyGate } from "@/lib/finityoGuards";
import { auditEngineCallFrom } from "@/lib/wiringAudit";

// ⬇️ Import the existing unified engine
import { computeDebtPlanUnified, type ComputeUnifiedArgs } from "./unified-engine";
import type { PlanResult } from "./plan-types";

// Re-export types for convenience
export type PlanEngineInput = ComputeUnifiedArgs;
export type PlanEngineResult = PlanResult;

/**
 * Master, guarded, and audited engine runner.
 * ALL calls to the math engine MUST go through this function.
 * Page ID is hard-locked to "PG_PLAN".
 */
export function runPlanEngineFromPG_PLAN(
  input: PlanEngineInput
): PlanEngineResult {
  // 1) Runtime guard: only PG_PLAN may call the engine
  finityoSafetyGate({
    pageId: "PG_PLAN",
    engineCall: true
  });

  // 2) Wiring audit: record and validate this engine call
  auditEngineCallFrom("PG_PLAN");

  // 3) Call the actual engine core (pure math / no side effects)
  const result = computeDebtPlanUnified(input);

  // 4) Return result back to PG_PLAN (which will handle persistence separately)
  return result;
}

/*
USAGE PATTERN (in PG_PLAN page – example):

import { runPlanEngineFromPG_PLAN } from "@/engine/runPlanEngine";

function handleComputePlanClick() {
  // build input from Lovable Cloud debts + settings
  const input: PlanEngineInput = {
    debts,
    strategy,
    extraMonthly,
    oneTimeExtra,
    startDate,
    maxMonths,
  };

  const result = runPlanEngineFromPG_PLAN(input);

  // result.months, result.totals, result.settings, etc.
  // then persist via WRITE_PLAN / WRITE_HISTORY in PG_PLAN flow
}
*/
