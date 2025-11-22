// ============================================================
// src/lib/number.ts
// Global numeric helpers (shared across components)
// ============================================================

export const n = (v: any): number => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};
