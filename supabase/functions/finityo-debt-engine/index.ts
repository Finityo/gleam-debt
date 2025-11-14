// supabase/functions/finityo-debt-engine/index.ts
// Deno edge function: unified debt engine (REST/PostgREST only)
// Routes:
//  - POST /plaid-import     { userId?:string } -> imports debts from Plaid liabilities
//  - POST /merge-preview    { plaid:DebtInput[], excel:DebtInput[], manual:DebtInput[] } -> merged list
//  - POST /utilization      { accounts: AccountBalance[] } -> utilization metrics

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

/* ==============================
   ENV & CONSTANTS
   ============================== */

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const PLAID_CLIENT_ID = Deno.env.get("PLAID_CLIENT_ID") ?? "";
const PLAID_SECRET = Deno.env.get("PLAID_SECRET") ?? "";
const PLAID_ENV = (Deno.env.get("PLAID_ENV") ?? "production").toLowerCase();

function plaidBaseUrl() {
  return PLAID_ENV === "production"
    ? "https://production.plaid.com"
    : "https://sandbox.plaid.com";
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/* ==============================
   TYPES
   ============================== */

type DebtSource = "plaid" | "excel" | "manual";

export interface DebtInput {
  id?: string;
  name: string;
  last4?: string | null;
  balance: number;
  minPayment: number;
  apr: number;
  dueDay?: number | null;
  debtType?: string | null;
  notes?: string | null;
  sourceAccountId?: string | null;
}

interface DebtRecord extends DebtInput {
  userId: string;
  source?: DebtSource;
  institutionName?: string | null;
}

interface AccountBalance {
  account_id: string;
  name: string;
  type: string;
  subtype?: string | null;
  current_balance: number;
  available_balance?: number | null;
  limit?: number | null;
  mask?: string | null;
}

interface CreditUtilization {
  totalCreditUsed: number;
  totalCreditLimit: number;
  totalAvailableCredit: number;
  utilizationPercentage: number;
  accountBreakdown: Array<{
    name: string;
    mask?: string | null;
    used: number;
    limit: number;
    utilization: number;
  }>;
}

/* ==============================
   NORMALIZERS & HELPERS
   ============================== */

function toAprDecimal(v: number | null | undefined) {
  if (v == null || Number.isNaN(v)) return 0;
  return v > 1 ? v / 100 : v;
}

function toDueDayInt(x: unknown): number | null {
  if (x == null) return null;
  const s = String(x);
  const m = s.match(/\d+/);
  if (!m) return null;
  const n = parseInt(m[0], 10);
  return Number.isFinite(n) && n >= 1 && n <= 31 ? n : null;
}

const asDebt = (v: number | null | undefined) => Math.max(0, Math.abs(v ?? 0));

function normalizeName(name: string) {
  return name
    .replace(/\s*[-•]\s*\d{4}$/i, "")
    .replace(/\s*\(.*?\d{4}.*?\)$/i, "")
    .replace(/\s*x+\d{4}$/i, "")
    .toLowerCase()
    .trim();
}

function strongKey(d: DebtInput & { source?: DebtSource }) {
  if (d.source === "plaid" && d.sourceAccountId) return `plaid:${d.sourceAccountId}`;
  const last4 = (d.last4 ?? "").trim();
  const norm = normalizeName(d.name);
  return `soft:${norm}::${last4}`;
}

/* ==============================
   REST REPO (PostgREST)
   ============================== */

function authHeaders(reqAuth?: string, preferReturn = false) {
  const headers: Record<string, string> = {
    apikey: SUPABASE_ANON_KEY,
    "Content-Type": "application/json",
  };
  if (reqAuth) headers.Authorization = reqAuth;
  if (preferReturn) headers.Prefer = "return=representation";
  return headers;
}

async function restGET(path: string, search: Record<string, string>, reqAuth?: string) {
  const qs = new URLSearchParams(search).toString();
  const url = `${SUPABASE_URL}/rest/v1/${path}?${qs}`;
  const res = await fetch(url, { headers: authHeaders(reqAuth) });
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function restPOST(path: string, body: unknown, reqAuth?: string) {
  const url = `${SUPABASE_URL}/rest/v1/${path}`;
  const res = await fetch(url, { 
    method: "POST", 
    headers: authHeaders(reqAuth, true), 
    body: JSON.stringify(body) 
  });
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function restPATCH(path: string, filters: Record<string, string>, body: unknown, reqAuth?: string) {
  const qs = new URLSearchParams(filters).toString();
  const url = `${SUPABASE_URL}/rest/v1/${path}?${qs}`;
  const res = await fetch(url, { 
    method: "PATCH", 
    headers: authHeaders(reqAuth, true), 
    body: JSON.stringify(body) 
  });
  if (!res.ok) throw new Error(`PATCH ${path} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function restRPC(fn: string, body: unknown, reqAuth?: string) {
  const url = `${SUPABASE_URL}/rest/v1/rpc/${fn}`;
  const res = await fetch(url, { 
    method: "POST", 
    headers: authHeaders(reqAuth), 
    body: JSON.stringify(body) 
  });
  if (!res.ok) throw new Error(`RPC ${fn} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

const debtRepo = {
  async findByUserNameLast4(userId: string, name: string, last4: string | null, reqAuth?: string): Promise<any | null> {
    const params: Record<string, string> = {
      user_id: `eq.${userId}`,
      name: `eq.${name}`,
      select: "*",
      limit: "1",
    };
    if (last4 == null) params["last4"] = "is.null";
    else params["last4"] = `eq.${last4}`;
    const rows = await restGET("debts", params, reqAuth);
    return rows?.[0] ?? null;
  },

  async upsert(record: DebtRecord, reqAuth?: string): Promise<any> {
    if (record.id) {
      const updated = await restPATCH("debts", { id: `eq.${record.id}` }, {
        user_id: record.userId,
        name: record.name,
        last4: record.last4 ?? null,
        balance: record.balance,
        apr: record.apr,
        min_payment: record.minPayment,
        due_date: record.dueDay ?? null,
        debt_type: record.debtType ?? null,
        notes: record.notes ?? null,
      }, reqAuth);
      return updated[0];
    } else {
      const inserted = await restPOST("debts", {
        user_id: record.userId,
        name: record.name,
        last4: record.last4 ?? null,
        balance: record.balance,
        apr: record.apr,
        min_payment: record.minPayment,
        due_date: record.dueDay ?? null,
        debt_type: record.debtType ?? null,
        notes: record.notes ?? null,
      }, reqAuth);
      return inserted[0];
    }
  },
};

/* ==============================
   MERGE & DEDUPE
   ============================== */

function mergeDebts(plaid: DebtInput[], excel: DebtInput[], manual: DebtInput[]) {
  const result: Array<DebtInput & { source: DebtSource; canonicalKey: string; isDuplicate: boolean }> = [];
  const seen = new Set<string>();

  const add = (d: DebtInput, source: DebtSource) => {
    const canonicalKey = strongKey({ ...d, source });
    if (seen.has(canonicalKey)) return;
    seen.add(canonicalKey);
    result.push({ ...d, source, canonicalKey, isDuplicate: false });
  };

  plaid.forEach(d => add(d, "plaid"));
  excel.forEach(d => add(d, "excel"));
  manual.forEach(d => add(d, "manual"));
  return result;
}

/* ==============================
   CREDIT UTILIZATION
   ============================== */

function calculateCreditUtilization(accounts: AccountBalance[]): CreditUtilization {
  const credit = accounts.filter(a => a.type === "credit");

  let totalUsed = 0;
  let totalLimit = 0;
  const breakdown: CreditUtilization["accountBreakdown"] = [];

  for (const a of credit) {
    const used = asDebt(a.current_balance);
    const limit = (a.limit != null && a.limit > 0)
      ? a.limit
      : used + asDebt(a.available_balance ?? 0);

    if (limit <= 0) continue;

    const pct = (used / limit) * 100;
    totalUsed += used;
    totalLimit += limit;

    breakdown.push({
      name: a.name,
      mask: a.mask ?? null,
      used: Number(used.toFixed(2)),
      limit: Number(limit.toFixed(2)),
      utilization: Number(pct.toFixed(2)),
    });
  }

  const totalAvailable = totalLimit - totalUsed;
  const overall = totalLimit > 0 ? (totalUsed / totalLimit) * 100 : 0;

  return {
    totalCreditUsed: Number(totalUsed.toFixed(2)),
    totalCreditLimit: Number(totalLimit.toFixed(2)),
    totalAvailableCredit: Number(totalAvailable.toFixed(2)),
    utilizationPercentage: Number(overall.toFixed(2)),
    accountBreakdown: breakdown,
  };
}

/* ==============================
   PLAID IMPORT (LIABILITIES)
   ============================== */

async function getPlaidItemIds(userId: string, reqAuth?: string): Promise<string[]> {
  const rows = await restGET("plaid_items", { user_id: `eq.${userId}`, select: "item_id" }, reqAuth);
  return (rows ?? []).map((r: any) => r.item_id);
}

async function getPlaidAccessToken(item_id: string, reqAuth?: string): Promise<string> {
  const res = await restRPC("get_plaid_token_from_vault", {
    p_item_id: item_id,
    p_function_name: "finityo-debt-engine",
  }, reqAuth);
  if (!res) throw new Error("Vault token RPC returned null");
  return res as string;
}

async function plaidLiabilities(accessToken: string) {
  const res = await fetch(`${plaidBaseUrl()}/liabilities/get`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: PLAID_CLIENT_ID,
      secret: PLAID_SECRET,
      access_token: accessToken,
    }),
  });
  if (!res.ok) throw new Error(`Plaid liabilities failed: ${res.status} ${await res.text()}`);
  return res.json();
}

function cardMinPaymentFallback(balance: number) {
  return Number(Math.max(25, balance * 0.01).toFixed(2));
}

function loanMinPaymentFallback(balance: number) {
  return Number(Math.max(25, balance * 0.015).toFixed(2));
}

async function importFromPlaidForUser(userId: string, reqAuth?: string) {
  const imported: any[] = [];
  const itemIds = await getPlaidItemIds(userId, reqAuth);
  if (!itemIds.length) return { message: "No connected accounts", count: 0, debts: [] };

  for (const itemId of itemIds) {
    let accessToken: string;
    try {
      accessToken = await getPlaidAccessToken(itemId, reqAuth);
    } catch (e) {
      console.error("Token vault error", itemId, e);
      continue;
    }

    let data: any;
    try {
      data = await plaidLiabilities(accessToken);
    } catch (e) {
      console.error("Plaid liabilities error", e);
      continue;
    }

    const accounts: any[] = data.accounts ?? [];

    // CREDIT CARDS
    for (const c of data.liabilities?.credit ?? []) {
      const acc = accounts.find(a => a.account_id === c.account_id);
      const name = acc?.name || c.name || "Credit Card";
      const last4 = acc?.mask || (c.account_id ? String(c.account_id).slice(-4) : null);

      const balance = asDebt(acc?.balances?.current);
      const apr = toAprDecimal(c.aprs?.[0]?.apr_percentage ?? 0);
      const minPayment = c.minimum_payment_amount && c.minimum_payment_amount > 0
        ? c.minimum_payment_amount
        : cardMinPaymentFallback(balance);
      const dueDay = toDueDayInt(c.next_payment_due_date ? new Date(c.next_payment_due_date).getDate() : null);

      const existing = await debtRepo.findByUserNameLast4(userId, name, last4, reqAuth);
      const rec: DebtRecord = {
        ...(existing ?? {}),
        userId,
        name,
        last4,
        balance,
        apr,
        minPayment,
        dueDay,
        debtType: "credit",
        source: "plaid",
        sourceAccountId: c.account_id,
        institutionName: data?.item?.institution_name ?? null,
      };
      const saved = await debtRepo.upsert(rec, reqAuth);
      imported.push(saved);
    }

    // STUDENT LOANS
    for (const s of data.liabilities?.student ?? []) {
      const name = s.loan_name || "Student Loan";
      const last4 = s.account_number ? String(s.account_number).slice(-4) : null;

      const balance = asDebt(s.balances?.current);
      const apr = toAprDecimal(s.interest_rate_percentage ?? 0);
      const minPayment = s.minimum_payment_amount && s.minimum_payment_amount > 0
        ? s.minimum_payment_amount
        : loanMinPaymentFallback(balance);
      const dueDay = toDueDayInt(s.next_payment_due_date ? new Date(s.next_payment_due_date).getDate() : null);

      const existing = await debtRepo.findByUserNameLast4(userId, name, last4, reqAuth);
      const rec: DebtRecord = {
        ...(existing ?? {}),
        userId,
        name,
        last4,
        balance,
        apr,
        minPayment,
        dueDay,
        debtType: "student",
        source: "plaid",
        sourceAccountId: s.account_id ?? null,
        institutionName: data?.item?.institution_name ?? null,
      };
      const saved = await debtRepo.upsert(rec, reqAuth);
      imported.push(saved);
    }

    // MORTGAGES
    for (const m of data.liabilities?.mortgage ?? []) {
      const name = m.property_address || "Mortgage";
      const last4 = m.account_number ? String(m.account_number).slice(-4) : null;

      const balance = asDebt(m.balances?.current);
      const apr = toAprDecimal(m.interest_rate?.percentage ?? 0);
      const minPayment = m.last_payment_amount && m.last_payment_amount > 0
        ? m.last_payment_amount
        : loanMinPaymentFallback(balance);
      const dueDay = toDueDayInt(m.next_payment_due_date ? new Date(m.next_payment_due_date).getDate() : null);

      const existing = await debtRepo.findByUserNameLast4(userId, name, last4, reqAuth);
      const rec: DebtRecord = {
        ...(existing ?? {}),
        userId,
        name,
        last4,
        balance,
        apr,
        minPayment,
        dueDay,
        debtType: "mortgage",
        source: "plaid",
        sourceAccountId: m.account_id ?? null,
        institutionName: data?.item?.institution_name ?? null,
      };
      const saved = await debtRepo.upsert(rec, reqAuth);
      imported.push(saved);
    }

    // FALLBACK LOANS
    for (const acc of accounts.filter(a => a.type === "loan")) {
      const name = acc.name || acc.official_name || "Loan";
      const last4 = acc.mask || (acc.account_id ? String(acc.account_id).slice(-4) : null);

      const balance = asDebt(acc?.balances?.current);
      const apr = toAprDecimal(0.05);
      const minPayment = loanMinPaymentFallback(balance);

      const existing = await debtRepo.findByUserNameLast4(userId, name, last4, reqAuth);
      const rec: DebtRecord = {
        ...(existing ?? {}),
        userId,
        name,
        last4,
        balance,
        apr,
        minPayment,
        dueDay: null,
        debtType: "loan",
        source: "plaid",
        sourceAccountId: acc.account_id ?? null,
        institutionName: data?.item?.institution_name ?? null,
      };
      const saved = await debtRepo.upsert(rec, reqAuth);
      imported.push(saved);
    }
  }

  return { message: `Imported ${imported.length} debts`, count: imported.length, debts: imported };
}

/* ==============================
   HTTP HANDLER
   ============================== */

serve(async (req) => {
  const url = new URL(req.url);
  const path = url.pathname.replace(/\/+$/, "");
  const auth = req.headers.get("Authorization") ?? undefined;

  try {
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (req.method !== "POST") {
      return json({ error: "Use POST" }, 405);
    }

    const body = await safeJson(req);
    const userId = (body?.userId as string | undefined) ?? "";

    if (path.endsWith("/plaid-import")) {
      if (!userId) return json({ error: "Missing userId" }, 400);
      const res = await importFromPlaidForUser(userId, auth);
      return json(res);
    }

    if (path.endsWith("/merge-preview")) {
      const plaid: DebtInput[] = (body?.plaid ?? []).map(normalizeDebtInput);
      const excel: DebtInput[] = (body?.excel ?? []).map(normalizeDebtInput);
      const manual: DebtInput[] = (body?.manual ?? []).map(normalizeDebtInput);
      const merged = mergeDebts(plaid, excel, manual);
      return json({ count: merged.length, merged });
    }

    if (path.endsWith("/utilization")) {
      const accounts: AccountBalance[] = (body?.accounts ?? []).map(normalizeAccountBalance);
      const util = calculateCreditUtilization(accounts);
      return json(util);
    }

    return json({ error: "Unknown route", path }, 404);
  } catch (e) {
    console.error("Debt engine error:", e);
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});

/* ==============================
   NORMALIZE INPUT PAYLOADS
   ============================== */

function normalizeDebtInput(d: any): DebtInput {
  return {
    id: d.id ?? undefined,
    name: String(d.name ?? "Account"),
    last4: d.last4 ?? null,
    balance: asDebt(Number(d.balance ?? 0)),
    minPayment: Math.max(0, Number(d.minPayment ?? d.min_payment ?? 0)),
    apr: toAprDecimal(Number(d.apr ?? 0)),
    dueDay: toDueDayInt(d.dueDay ?? d.due_date ?? null),
    debtType: d.debtType ?? d.debt_type ?? null,
    notes: d.notes ?? null,
    sourceAccountId: d.sourceAccountId ?? d.source_account_id ?? null,
  };
}

function normalizeAccountBalance(a: any): AccountBalance {
  return {
    account_id: String(a.account_id ?? ""),
    name: String(a.name ?? "Account"),
    type: String(a.type ?? "credit"),
    subtype: a.subtype ?? null,
    current_balance: Number(a.current_balance ?? 0),
    available_balance: a.available_balance == null ? null : Number(a.available_balance),
    limit: a.limit == null ? null : Number(a.limit),
    mask: a.mask ?? null,
  };
}

/* ==============================
   UTILS
   ============================== */

async function safeJson(req: Request) {
  try {
    const t = await req.text();
    return t ? JSON.parse(t) : {};
  } catch {
    return {};
  }
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
}
