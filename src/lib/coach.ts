// ======================================================================
// COACH MODE — Data Models & API
// ======================================================================

export type CoachComment = {
  id: string;
  coachName: string;
  text: string;
  createdAt: string;
  resolved?: boolean;
  area?: { type: "month" | "debt"; refId: string; label: string };
};

// Simple in-memory store (replace with DB persistence)
const coachStore: Record<string, CoachComment[]> = {};

export async function coachGet(planId: string): Promise<CoachComment[]> {
  return coachStore[planId] ?? [];
}

export async function coachAdd(planId: string, comment: CoachComment) {
  coachStore[planId] = coachStore[planId] ?? [];
  coachStore[planId].unshift(comment);
}

export async function coachToggle(planId: string, id: string) {
  coachStore[planId] = (coachStore[planId] ?? []).map((c) =>
    c.id === id ? { ...c, resolved: !c.resolved } : c
  );
}

export async function coachDelete(planId: string, id: string) {
  coachStore[planId] = (coachStore[planId] ?? []).filter((c) => c.id !== id);
}
