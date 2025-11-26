// ============================================================
// src/lib/number.ts
// Global numeric helpers (shared across components)
// ============================================================

export const n = (v: any): number => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};

export const toNum = (v: any, fallback = 0): number => {
  const x = Number(v);
  return Number.isFinite(x) ? x : fallback;
};

export const clamp = (v: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, v));
};

export const safeAPR = (apr: any): number => {
  const val = toNum(apr);
  return clamp(val, 0, 100);
};
