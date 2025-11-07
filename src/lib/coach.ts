// ======================================================================
// COACH MODE — Data Models & API
// ======================================================================

export type CoachComment = {
  id: string;
  coachName: string;
  text: string;
  createdAt: string;
  resolved?: boolean;
  area?: { type: "month" | "debt"; refId: string };
};

// Simple in-memory store (replace with DB persistence)
const coachStore: Record<string, CoachComment[]> = {};

export async function addCoachComment(planId: string, comment: CoachComment) {
  coachStore[planId] = coachStore[planId] ?? [];
  coachStore[planId].push(comment);
}

export async function getCoachComments(planId: string): Promise<CoachComment[]> {
  return coachStore[planId] ?? [];
}

export async function toggleResolved(planId: string, id: string) {
  coachStore[planId] = (coachStore[planId] ?? []).map((c) =>
    c.id === id ? { ...c, resolved: !c.resolved } : c
  );
}
