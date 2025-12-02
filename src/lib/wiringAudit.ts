// wiringAudit.ts
// Finityo Wiring Audit Tool
// Passive recorder + rule checker for engine, writes, nav, compare, and DB usage

// ==============================
// TYPES
// ==============================

export type PageId =
  | "PG_HOME"
  | "PG_AUTH"
  | "PG_DASH"
  | "PG_DEBTS"
  | "PG_PLAN"
  | "PG_CAL"
  | "PG_CHARTS"
  | "PG_SUMMARY"
  | "PG_COMPARE"
  | "PG_SETTINGS"
  | "PG_SHARE";

export type NavSource = PageId | "FOOTER" | "SYSTEM";

export type DbName = "DS_LOVABLE_CLOUD" | string;

export interface EngineCallEvent {
  type: "ENGINE_CALL";
  pageId: PageId;
  timestamp: number;
}

export interface WriteEvent {
  type: "WRITE";
  pageId: PageId;
  dbName: DbName;
  timestamp: number;
}

export interface CompareEvent {
  type: "COMPARE_WRITE";
  target: "local" | "cloud";
  timestamp: number;
}

export interface NavEvent {
  type: "NAV";
  source: NavSource;
  destination: PageId;
  timestamp: number;
}

export type AuditEvent =
  | EngineCallEvent
  | WriteEvent
  | CompareEvent
  | NavEvent;

export interface AuditViolation {
  code:
    | "ENGINE_ACCESS_VIOLATION"
    | "READONLY_WRITE_VIOLATION"
    | "DB_VIOLATION"
    | "COMPARE_SANDBOX_VIOLATION"
    | "NAV_AUTHORITY_VIOLATION";
  message: string;
  event?: AuditEvent;
}

export interface AuditReport {
  events: AuditEvent[];
  violations: AuditViolation[];
  hasViolations: boolean;
}

// ==============================
// RULE CONSTANTS
// ==============================

const READ_ONLY_PAGES: PageId[] = [
  "PG_CAL",
  "PG_CHARTS",
  "PG_SUMMARY",
  "PG_SHARE",
  "PG_COMPARE"
];

const ENGINE_ALLOWED_PAGES: PageId[] = ["PG_PLAN"];

const DB_ALLOWED: DbName[] = ["DS_LOVABLE_CLOUD"];

const NAV_AUTHORITY_SOURCES: NavSource[] = ["PG_HOME", "FOOTER"];

// ==============================
// IN-MEMORY EVENT STORE
// (You can swap this for a logger or external sink)
// ==============================

const eventBuffer: AuditEvent[] = [];

// ==============================
// RECORDERS (call these from app code)
// ==============================

export function auditRecordEngineCall(pageId: PageId) {
  const evt: EngineCallEvent = {
    type: "ENGINE_CALL",
    pageId,
    timestamp: Date.now()
  };
  eventBuffer.push(evt);
}

export function auditRecordWrite(pageId: PageId, dbName: DbName) {
  const evt: WriteEvent = {
    type: "WRITE",
    pageId,
    dbName,
    timestamp: Date.now()
  };
  eventBuffer.push(evt);
}

export function auditRecordCompare(target: "local" | "cloud") {
  const evt: CompareEvent = {
    type: "COMPARE_WRITE",
    target,
    timestamp: Date.now()
  };
  eventBuffer.push(evt);
}

export function auditRecordNavigation(source: NavSource, destination: PageId) {
  const evt: NavEvent = {
    type: "NAV",
    source,
    destination,
    timestamp: Date.now()
  };
  eventBuffer.push(evt);
}

// Optional: clear events between runs
export function auditReset() {
  eventBuffer.length = 0;
}

// ==============================
// RULE CHECKERS (internal)
// ==============================

function checkEngineCall(evt: EngineCallEvent): AuditViolation[] {
  if (!ENGINE_ALLOWED_PAGES.includes(evt.pageId)) {
    return [
      {
        code: "ENGINE_ACCESS_VIOLATION",
        message: `Engine called from illegal page: ${evt.pageId}`,
        event: evt
      }
    ];
  }
  return [];
}

function checkWrite(evt: WriteEvent): AuditViolation[] {
  const violations: AuditViolation[] = [];

  if (READ_ONLY_PAGES.includes(evt.pageId)) {
    violations.push({
      code: "READONLY_WRITE_VIOLATION",
      message: `Read-only page attempted write: ${evt.pageId}`,
      event: evt
    });
  }

  if (!DB_ALLOWED.includes(evt.dbName)) {
    violations.push({
      code: "DB_VIOLATION",
      message: `Unauthorized DB used: ${evt.dbName}`,
      event: evt
    });
  }

  return violations;
}

function checkCompare(evt: CompareEvent): AuditViolation[] {
  if (evt.target !== "local") {
    return [
      {
        code: "COMPARE_SANDBOX_VIOLATION",
        message: `Compare attempted non-local target: ${evt.target}`,
        event: evt
      }
    ];
  }
  return [];
}

function checkNav(evt: NavEvent): AuditViolation[] {
  const violations: AuditViolation[] = [];

  // Engine + routing law: only PG_HOME + FOOTER own primary nav authority.
  if (!NAV_AUTHORITY_SOURCES.includes(evt.source)) {
    violations.push({
      code: "NAV_AUTHORITY_VIOLATION",
      message: `Navigation attempted from non-authoritative source: ${evt.source} -> ${evt.destination}`,
      event: evt
    });
  }

  return violations;
}

// ==============================
// MAIN AUDIT RUNNER
// ==============================

export function runWiringAudit(): AuditReport {
  const violations: AuditViolation[] = [];

  for (const evt of eventBuffer) {
    switch (evt.type) {
      case "ENGINE_CALL":
        violations.push(...checkEngineCall(evt));
        break;
      case "WRITE":
        violations.push(...checkWrite(evt));
        break;
      case "COMPARE_WRITE":
        violations.push(...checkCompare(evt));
        break;
      case "NAV":
        violations.push(...checkNav(evt));
        break;
      default:
        break;
    }
  }

  return {
    events: [...eventBuffer],
    violations,
    hasViolations: violations.length > 0
  };
}

// ==============================
// SAMPLE INTEGRATION HELPERS
// (optional, for convenience)
// ==============================

export function auditEngineCallFrom(pageId: PageId) {
  auditRecordEngineCall(pageId);
  const report = runWiringAudit();
  if (report.hasViolations) {
    console.error("[WIRING AUDIT] Engine violation detected", report.violations);
  }
}

export function auditWriteFrom(pageId: PageId, dbName: DbName) {
  auditRecordWrite(pageId, dbName);
  const report = runWiringAudit();
  if (report.hasViolations) {
    console.error("[WIRING AUDIT] Write violation detected", report.violations);
  }
}

export function auditCompareTarget(target: "local" | "cloud") {
  auditRecordCompare(target);
  const report = runWiringAudit();
  if (report.hasViolations) {
    console.error("[WIRING AUDIT] Compare sandbox violation detected", report.violations);
  }
}

export function auditNavigation(source: NavSource, destination: PageId) {
  auditRecordNavigation(source, destination);
  const report = runWiringAudit();
  if (report.hasViolations) {
    console.error("[WIRING AUDIT] Navigation authority violation detected", report.violations);
  }
}
