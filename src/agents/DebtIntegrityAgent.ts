// ============================================================
// FILE: src/agents/DebtIntegrityAgent.ts
// Debt-aware integrity agent with embedded domain event bus
// Enforces: realistic APR ranges, valid debt structure, sane numeric relationships
// ============================================================

import { supabase } from "@/integrations/supabase/client";

/* ---------- EMBEDDED DOMAIN EVENT BUS ---------- */

export type Debt = {
  id: string;
  name?: string;
  balance: number | null;
  minPayment: number | null;
  apr: number | null;
  source?: "excel" | "plaid" | "manual";
};

export type DomainEvent =
  | {
      type: "DebtBatchImported";
      debts: Debt[];
      source: "excel" | "plaid";
      userId?: string;
      timestamp?: number;
    }
  | {
      type: "DebtEdited";
      debt: Debt;
      userId?: string;
      timestamp?: number;
    }
  | {
      type: "PlanComputed";
      planId?: string;
      debts: Debt[];
      userId?: string;
      timestamp?: number;
    };

type Subscriber = (e: DomainEvent) => void | Promise<void>;

const subscribers: Subscriber[] = [];

/**
 * Subscribe once, agent-style
 * Subscribers are called synchronously in order
 */
export function subscribeToDomainEvents(fn: Subscriber) {
  subscribers.push(fn);
}

/**
 * Emit from UI / server actions around sensitive edges (import, edit, compute)
 * All subscribers are called synchronously; if any throws, emission is blocked
 */
export async function emitDomainEvent(e: DomainEvent): Promise<void> {
  const evtWithTs: DomainEvent = {
    ...e,
    timestamp: e.timestamp ?? Date.now(),
  };

  for (const sub of subscribers) {
    try {
      await sub(evtWithTs);
    } catch (err) {
      console.error("[DomainEvents] Subscriber threw - blocking event:", err);
      throw err; // Re-throw to block the operation
    }
  }
}

/* ---------- CONFIG: Protection Goals ---------- */

/**
 * Core Finityo integrity goals:
 * 1) APR values must be realistic (0-80%)
 * 2) Debts must have at least one meaningful field
 * 3) Imports must not create phantom rows
 * 4) User sees what they expect (no math surprises)
 */

const MIN_APR = 0; // 0% allowed (promo / free)
const MAX_APR = 80; // hard ceiling; anything above is suspect
const MAX_IDENTICAL_APR_BATCH = 1; // if entire batch has same APR, flag

/* ---------- ISSUE TYPES ---------- */

export type DebtIntegrityIssueCode =
  | "APR_OUT_OF_RANGE"
  | "APR_BATCH_ANOMALY"
  | "EMPTY_DEBT_ROW"
  | "NEGATIVE_BALANCE"
  | "NEGATIVE_MINIMUM"
  | "ZERO_MIN_WITH_BALANCE"
  | "MISSING_ID"
  | "GENERAL_INTEGRITY_ERROR";

export type DebtIntegrityIssue = {
  code: DebtIntegrityIssueCode;
  message: string;
  debtId?: string;
  debtName?: string;
  details?: any;
};

/* ---------- PURE RULES ENGINE ---------- */

export function analyzeDebtBatch(debts: Debt[]): DebtIntegrityIssue[] {
  const issues: DebtIntegrityIssue[] = [];

  // Normalize and collect APR values for batch analysis
  const aprs = debts
    .map((d) => (d.apr === null ? null : Number(d.apr)))
    .filter((v) => v !== null && !Number.isNaN(v)) as number[];

  // 1) Per-debt rules
  for (const d of debts) {
    const id = d.id;
    const name = d.name?.trim() || "(unnamed debt)";

    // Missing ID
    if (!id) {
      issues.push({
        code: "MISSING_ID",
        message: "Debt row is missing an ID; navigation and updates will break.",
        debtId: id,
        debtName: name,
      });
    }

    // Completely empty row (phantom debt)
    const isEmpty =
      (!d.name || d.name.trim() === "") &&
      (d.balance === null || Number.isNaN(d.balance as any)) &&
      (d.minPayment === null || Number.isNaN(d.minPayment as any)) &&
      (d.apr === null || Number.isNaN(d.apr as any));

    if (isEmpty) {
      issues.push({
        code: "EMPTY_DEBT_ROW",
        message: "Found a completely empty debt row (phantom debt).",
        debtId: id,
        debtName: name,
      });
    }

    // Negative balance
    if (d.balance !== null && Number(d.balance) < 0) {
      issues.push({
        code: "NEGATIVE_BALANCE",
        message: "Debt has a negative balance, which is not allowed.",
        debtId: id,
        debtName: name,
        details: { balance: d.balance },
      });
    }

    // Negative minimum payment
    if (d.minPayment !== null && Number(d.minPayment) < 0) {
      issues.push({
        code: "NEGATIVE_MINIMUM",
        message: "Debt has a negative minimum payment, which is not allowed.",
        debtId: id,
        debtName: name,
        details: { minPayment: d.minPayment },
      });
    }

    // Zero minimum with positive balance (suspicious unless special flag exists)
    if (
      d.balance !== null &&
      Number(d.balance) > 0 &&
      (d.minPayment === null || Number(d.minPayment) === 0)
    ) {
      issues.push({
        code: "ZERO_MIN_WITH_BALANCE",
        message:
          "Debt has a non-zero balance but a zero/empty minimum payment. Likely import or mapping error.",
        debtId: id,
        debtName: name,
        details: { balance: d.balance, minPayment: d.minPayment },
      });
    }

    // APR out of range
    if (d.apr !== null && !Number.isNaN(d.apr)) {
      const aprNum = Number(d.apr);
      if (aprNum < MIN_APR || aprNum > MAX_APR) {
        issues.push({
          code: "APR_OUT_OF_RANGE",
          message: `APR ${aprNum}% is outside allowed range ${MIN_APR}–${MAX_APR}%.`,
          debtId: id,
          debtName: name,
          details: { apr: aprNum },
        });
      }
    }
  }

  // 2) Batch-level APR anomaly (catches "100% on all rows" bug)
  if (aprs.length > 0) {
    const uniqueAprs = new Set(aprs);
    if (uniqueAprs.size <= MAX_IDENTICAL_APR_BATCH) {
      const [onlyAPR] = Array.from(uniqueAprs);
      issues.push({
        code: "APR_BATCH_ANOMALY",
        message: `All debts in this import share the same APR (${onlyAPR}%). This is likely a mapping or coercion bug.`,
        details: { aprs, uniqueCount: uniqueAprs.size, onlyAPR },
      });
    }
  }

  return issues;
}

/* ---------- LOGGING TO LOVABLE CLOUD ---------- */

async function logDebtIntegrityIssues(params: {
  userId?: string;
  source: "excel" | "plaid" | "manual" | "engine";
  context: "import" | "edit" | "compute";
  issues: DebtIntegrityIssue[];
}) {
  try {
    if (!params.issues.length) return;

    const { error } = await supabase.from("debt_integrity_logs").insert({
      user_id: params.userId ?? null,
      source: params.source,
      context: params.context,
      issues: params.issues,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("[DebtIntegrityAgent] Failed to log issues:", error);
    }
  } catch (err) {
    console.error("[DebtIntegrityAgent] Logging threw:", err);
  }
}

/* ---------- AGENT SUBSCRIPTION: AUTOMATIC ENFORCEMENT ---------- */

subscribeToDomainEvents(async (event) => {
  try {
    switch (event.type) {
      case "DebtBatchImported": {
        const issues = analyzeDebtBatch(event.debts);
        if (issues.length > 0) {
          console.error("🚨 [DebtIntegrityAgent] Import blocked:", issues);
          await logDebtIntegrityIssues({
            userId: event.userId,
            source: event.source,
            context: "import",
            issues,
          });
          // HARD ENFORCEMENT: Block bad batch from being saved
          throw new Error(
            `Debt import blocked: ${issues.length} integrity issue(s) detected. ${issues[0].message}`
          );
        }
        console.log("✅ [DebtIntegrityAgent] Import batch passed validation");
        break;
      }

      case "DebtEdited": {
        const issues = analyzeDebtBatch([event.debt]);
        if (issues.length > 0) {
          console.warn("⚠️ [DebtIntegrityAgent] Edit integrity warning:", issues);
          await logDebtIntegrityIssues({
            userId: event.userId,
            source: event.debt.source ?? "manual",
            context: "edit",
            issues,
          });
          // For edits, WARN but allow (user might be fixing incrementally)
          // To block: throw new Error(...)
        }
        break;
      }

      case "PlanComputed": {
        // Light sanity check: plan inputs look sane
        const issues = analyzeDebtBatch(event.debts);
        if (issues.length > 0) {
          console.warn(
            "⚠️ [DebtIntegrityAgent] Plan computed with integrity issues:",
            issues
          );
          await logDebtIntegrityIssues({
            userId: event.userId,
            source: "engine",
            context: "compute",
            issues,
          });
        }
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error("[DebtIntegrityAgent] Enforcement error:", err);
    throw err; // Re-throw to block the operation
  }
});

/* ---------- PUBLIC HELPER FUNCTIONS ---------- */

/**
 * Call after Excel/Plaid import completes
 */
export function reportDebtBatchImported(
  debts: Debt[],
  source: "excel" | "plaid",
  userId?: string
) {
  return emitDomainEvent({
    type: "DebtBatchImported",
    debts,
    source,
    userId,
  });
}

/**
 * Call after user edits a single debt
 */
export function reportDebtEdited(debt: Debt, userId?: string) {
  return emitDomainEvent({
    type: "DebtEdited",
    debt,
    userId,
  });
}

/**
 * Call after plan is computed
 */
export function reportPlanComputed(
  debts: Debt[],
  planId?: string,
  userId?: string
) {
  return emitDomainEvent({
    type: "PlanComputed",
    debts,
    planId,
    userId,
  });
}

console.log("🔒 [DebtIntegrityAgent] Agent initialized and monitoring");
