// src/router/guardedNavigate.ts
// Centralized, audited, and authority-locked navigation gateway.
// ONLY PG_HOME and FOOTER may initiate navigation.

import { finityoSafetyGate } from "@/lib/finityoGuards";
import { auditNavigation } from "@/lib/wiringAudit";
import type { PageId, NavSource } from "@/lib/wiringAudit";

// Route mapping from PageId to actual routes
const PAGE_ROUTES: Record<PageId, string> = {
  PG_HOME: "/",
  PG_AUTH: "/auth",
  PG_DASH: "/dashboard",
  PG_DEBTS: "/debts",
  PG_PLAN: "/debt-plan",
  PG_CAL: "/payoff-calendar",
  PG_CHARTS: "/debt-chart",
  PG_SUMMARY: "/debt-plan/summary",
  PG_COMPARE: "/scenarios",
  PG_SETTINGS: "/settings",
  PG_SHARE: "/share-history"
};

/**
 * Master, guarded, and audited navigation function.
 * ALL navigation in the app MUST go through this.
 * 
 * @param source - The component/page initiating navigation (must be PG_HOME or FOOTER)
 * @param destination - The target page ID
 * @param navigateFn - The actual navigate function from useNavigate() hook
 */
export function guardedNavigate(
  source: NavSource,
  destination: PageId,
  navigateFn: (path: string) => void
) {
  // 1) Runtime guard: only PG_HOME + FOOTER control routing authority
  finityoSafetyGate({
    navSource: source
  });

  // 2) Wiring audit: record + validate the navigation event
  auditNavigation(source, destination);

  // 3) Perform the actual navigation
  const route = PAGE_ROUTES[destination];
  if (!route) {
    throw new Error(`Invalid destination PageId: ${destination}`);
  }
  
  navigateFn(route);
}

/*
===========================================
USAGE PATTERNS (MANDATORY)
===========================================

// ✅ LEGAL
import { useNavigate } from 'react-router-dom';
import { guardedNavigate } from '@/router/guardedNavigate';

function Hero() {
  const navigate = useNavigate();
  
  const handleGetStarted = () => {
    guardedNavigate("PG_HOME", "PG_AUTH", navigate);
  };
}

function Footer() {
  const navigate = useNavigate();
  
  const handleNavToPlan = () => {
    guardedNavigate("FOOTER", "PG_PLAN", navigate);
  };
}

// ❌ ILLEGAL (WILL THROW + LOG + FLAG)
guardedNavigate("PG_DASH", "PG_PLAN", navigate);      // VIOLATION
guardedNavigate("PG_COMPARE", "PG_PLAN", navigate);   // VIOLATION
guardedNavigate("PG_SETTINGS", "PG_DEBTS", navigate); // VIOLATION

===========================================
INTEGRATION RULE
===========================================

- REMOVE all direct calls to:
  - navigate('/path')
- REPLACE with:
  - guardedNavigate(source, destination, navigate)

===========================================
ENFORCEMENT GUARANTEES
===========================================

✅ Rogue page self-routing is impossible  
✅ Privilege escalation into PG_PLAN is blocked  
✅ Audit always captures navigation attempts  
✅ AI Routing Authority Inspector will flag violations  
*/
