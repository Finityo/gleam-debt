// ===================================
// src/lib/categoryColors.ts
// ===================================
export const CATEGORY_COLORS: Record<string, string> = {
  credit: "#d4af37",      // gold
  loan: "#000000",        // black
  medical: "#7d7d7d",     // gray
  other: "#4a4a4a",       // fallback
};

export function getCategoryColor(category?: string) {
  return CATEGORY_COLORS[category ?? "other"] ?? CATEGORY_COLORS.other;
}
