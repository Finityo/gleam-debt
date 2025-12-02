// ============================================================
// FILE: src/domain/domainEvents.ts
// Simple in-process domain event bus for Finityo
// Enables decoupled enforcement agents to monitor debt operations
// ============================================================

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
      planId: string;
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
