// finityoViolationSmokeTest.ts
// PURPOSE: Verify Guards + Wiring Audit + AI Agents all trip correctly
// RUN IN: Dev / Test only

import {
  finityoSafetyGate
} from "@/lib/finityoGuards";

import {
  auditEngineCallFrom,
  auditWriteFrom,
  auditCompareTarget,
  auditNavigation,
  runWiringAudit
} from "@/lib/wiringAudit";

// ==============================
// 1️⃣ ENGINE VIOLATION TEST
// Illegal engine call from PG_CAL (should HARD FAIL)
// ==============================

try {
  console.log("TEST 1: Engine call from PG_CAL (should FAIL)");
  finityoSafetyGate({
    pageId: "PG_CAL",
    engineCall: true
  });

  auditEngineCallFrom("PG_CAL");
} catch (e) {
  console.error("✅ EXPECTED ENGINE VIOLATION:", e);
}

// ==============================
// 2️⃣ READ-ONLY WRITE VIOLATION
// PG_SUMMARY attempts DB write (should FAIL)
// ==============================

try {
  console.log("TEST 2: Write from PG_SUMMARY (should FAIL)");
  finityoSafetyGate({
    pageId: "PG_SUMMARY",
    writeAttempt: true,
    dbName: "DS_LOVABLE_CLOUD"
  });

  auditWriteFrom("PG_SUMMARY", "DS_LOVABLE_CLOUD");
} catch (e) {
  console.error("✅ EXPECTED READ-ONLY WRITE VIOLATION:", e);
}

// ==============================
// 3️⃣ DB VIOLATION TEST
// Any DB other than DS_LOVABLE_CLOUD (should FAIL)
// ==============================

try {
  console.log("TEST 3: Unauthorized DB usage (should FAIL)");
  finityoSafetyGate({
    pageId: "PG_DEBTS",
    writeAttempt: true,
    dbName: "SUPABASE"
  });

  auditWriteFrom("PG_DEBTS", "SUPABASE");
} catch (e) {
  console.error("✅ EXPECTED DB VIOLATION:", e);
}

// ==============================
// 4️⃣ COMPARE SANDBOX VIOLATION
// Compare attempts cloud write (should FAIL)
// ==============================

try {
  console.log("TEST 4: Compare writes to cloud (should FAIL)");
  finityoSafetyGate({
    pageId: "PG_COMPARE",
    compareTarget: "cloud"
  });

  auditCompareTarget("cloud");
} catch (e) {
  console.error("✅ EXPECTED COMPARE SANDBOX VIOLATION:", e);
}

// ==============================
// 5️⃣ NAVIGATION AUTHORITY VIOLATION
// PG_DASH attempts to control routing (should FAIL)
// ==============================

try {
  console.log("TEST 5: Rogue navigation from PG_DASH (should FAIL)");
  finityoSafetyGate({
    navSource: "PG_DASH"
  });

  auditNavigation("PG_DASH", "PG_PLAN");
} catch (e) {
  console.error("✅ EXPECTED NAVIGATION VIOLATION:", e);
}

// ==============================
// FINAL AUDIT REPORT
// ==============================

const finalReport = runWiringAudit();
console.log("FINAL AUDIT REPORT:", finalReport);

/*
EXPECTED OUTCOME:

✅ Guards throw immediately on each violation
✅ Wiring Audit logs violations
✅ AI Agents flag in detect–halt mode
✅ finalReport.hasViolations === true
✅ finalReport.violations.length >= 5
*/
