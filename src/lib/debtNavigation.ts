// ============================================================
// src/lib/debtNavigation.ts
// Safe debt card navigation with guard enforcement
// ============================================================

import { guardedNavigate } from "@/router/guardedNavigate";
import type { PageId } from "@/lib/wiringAudit";

/**
 * Safe debt navigation with ID validation
 * Prevents silent failures when debt ID is missing
 */
export function safeDebtNav(
  debt: any,
  navigate: (path: string) => void,
  sourcePage: PageId = "PG_DEBTS",
  destinationPage: PageId = "PG_PLAN"
) {
  if (!debt?.id) {
    console.warn("❌ BLOCKED NAVIGATION: Missing debt ID", debt);
    return;
  }

  guardedNavigate(sourcePage, destinationPage, navigate);
}
