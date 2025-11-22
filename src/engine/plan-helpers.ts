// ============================================================
// src/engine/plan-helpers.ts
// Utility helpers for numeric safety and ordering
// ============================================================

export const toNum = (v: any, def = 0): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
};

export const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

export const safeAPR = (apr: any) => clamp(toNum(apr, 0), 0, 100);
