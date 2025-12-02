// finityoGuards.ts
// Master runtime enforcement layer for Finityo
// These guards HARD-STOP illegal behavior at execution time

// ==============================
// A) ENGINE ACCESS GUARD
// Only PG_PLAN may call the engine
// ==============================
export function assertEngineAccess(pageId: string) {
  if (pageId !== "PG_PLAN") {
    throw new Error(
      `ENGINE ACCESS VIOLATION: ${pageId} attempted to call DS_ENGINE`
    );
  }
}

// ==============================
// B) READ-ONLY PAGE WRITE LOCK
// Prevents writes from mirror pages
// ==============================
export function assertReadOnlyPage(pageId: string) {
  const READ_ONLY_PAGES = [
    "PG_CAL",
    "PG_CHARTS",
    "PG_SUMMARY",
    "PG_SHARE",
    "PG_COMPARE"
  ];

  if (READ_ONLY_PAGES.includes(pageId)) {
    throw new Error(
      `WRITE VIOLATION: ${pageId} is READ-ONLY and cannot write to Lovable Cloud`
    );
  }
}

// ==============================
// C) CLEAR PLAN LOCAL-ONLY GUARD
// Prevents BTN_CLEAR_PLAN from touching DB
// ==============================
export function assertLocalOnlyClear(isPersistAttempt: boolean) {
  if (isPersistAttempt) {
    throw new Error(
      "BTN_CLEAR_PLAN VIOLATION: Attempted DB write from local-only clear"
    );
  }
}

// ==============================
// D) COMPARE SANDBOX LOCK
// Prevents Compare from overwriting production plan
// ==============================
export function assertCompareSandbox(target: "local" | "cloud") {
  if (target !== "local") {
    throw new Error(
      "COMPARE VIOLATION: Compare attempted to write to Lovable Cloud"
    );
  }
}

// ==============================
// E) LOVABLE CLOUD EXCLUSIVE DB GUARD
// Hard kill if any other DB is used
// ==============================
export function assertLovableCloudOnly(dbName: string) {
  if (dbName !== "DS_LOVABLE_CLOUD") {
    throw new Error(
      `DB VIOLATION: Unauthorized data source -> ${dbName}`
    );
  }
}

// ==============================
// F) NAVIGATION AUTHORITY GUARD
// Only PG_HOME and Footer may control routing
// ==============================
export function assertNavigationAuthority(source: string) {
  const ALLOWED = ["PG_HOME", "FOOTER"];

  if (!ALLOWED.includes(source)) {
    throw new Error(
      `NAVIGATION VIOLATION: ${source} attempted to override routing authority`
    );
  }
}

// ==============================
// G) MASTER SAFETY WRAPPER (OPTIONAL)
// Centralized enforcement call if desired
// ==============================
export function finityoSafetyGate(options: {
  pageId?: string;
  dbName?: string;
  isPersistAttempt?: boolean;
  compareTarget?: "local" | "cloud";
  navSource?: string;
  engineCall?: boolean;
  writeAttempt?: boolean;
}) {
  const {
    pageId,
    dbName,
    isPersistAttempt,
    compareTarget,
    navSource,
    engineCall,
    writeAttempt
  } = options;

  if (engineCall && pageId) assertEngineAccess(pageId);
  if (writeAttempt && pageId) assertReadOnlyPage(pageId);
  if (typeof isPersistAttempt === "boolean") assertLocalOnlyClear(isPersistAttempt);
  if (compareTarget) assertCompareSandbox(compareTarget);
  if (dbName) assertLovableCloudOnly(dbName);
  if (navSource) assertNavigationAuthority(navSource);
}
