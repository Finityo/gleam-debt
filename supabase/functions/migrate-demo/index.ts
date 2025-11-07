import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// ============================================================================
// PLAN API (embedded for edge function use)
// ============================================================================

function computeDebtPlan(debts: any[], settings: any) {
  // Stub - actual computation happens client-side or via separate function
  // For migration, we don't need to compute, just store
  return null;
}

function nowISO() {
  return new Date().toISOString();
}

const PlanAPI = {
  async get(supabase: any, userId: string) {
    const { data, error } = await supabase
      .from('user_plan_data')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) return {
      debts: [],
      settings: { extraMonthly: 0, oneTimeExtra: 0, strategy: 'snowball' },
      notes: '',
      plan: null,
      updatedAt: nowISO(),
    };

    return {
      debts: (data.debts as any) || [],
      settings: (data.settings as any) || { extraMonthly: 0, oneTimeExtra: 0, strategy: 'snowball' },
      notes: (data.notes as string) || '',
      plan: (data.plan as any) || null,
      updatedAt: data.updated_at,
    };
  },

  async put(supabase: any, userId: string, payload: any) {
    const { error } = await supabase
      .from('user_plan_data')
      .upsert({
        user_id: userId,
        debts: payload.debts as any,
        settings: payload.settings as any,
        notes: payload.notes,
        plan: payload.plan as any,
        updated_at: payload.updatedAt,
      } as any, {
        onConflict: 'user_id',
      });

    if (error) throw error;
  },

  async merge(supabase: any, userId: string, incoming: any) {
    const current = await this.get(supabase, userId);

    // debt signature to detect dupes
    const sig = (d: any) =>
      `${d.name}|${Math.round(d.balance)}|${Math.round(d.apr * 100)}`;

    const seen = new Set(current.debts.map(sig));

    const mergedDebts = [
      ...current.debts,
      ...(incoming.debts ?? []).filter((d: any) => {
        const s = sig(d);
        if (seen.has(s)) return false;
        seen.add(s);
        return true;
      }),
    ];

    const mergedSettings = {
      ...current.settings,
      ...(incoming.settings ?? {}),
    };

    const mergedNotes = incoming.notes || current.notes || '';

    const plan = computeDebtPlan(mergedDebts, mergedSettings);

    const payload = {
      debts: mergedDebts,
      settings: mergedSettings,
      notes: mergedNotes,
      plan,
      updatedAt: nowISO(),
      migratedFrom: incoming.migratedFrom ?? 'demo',
      migratedMode: 'merge',
    };

    await this.put(supabase, userId, payload);
    return payload;
  },

  async replace(supabase: any, userId: string, incoming: any) {
    const debts = incoming.debts ?? [];
    const settings = incoming.settings ?? {
      extraMonthly: 0,
      oneTimeExtra: 0,
      strategy: 'snowball',
    };
    const notes = incoming.notes ?? '';

    const plan = computeDebtPlan(debts, settings);

    const payload = {
      debts,
      settings,
      notes,
      plan,
      updatedAt: nowISO(),
      migratedFrom: incoming.migratedFrom ?? 'demo',
      migratedMode: 'replace',
    };

    await this.put(supabase, userId, payload);
    return payload;
  },
};

// ============================================================================
// EDGE FUNCTION HANDLER
// ============================================================================

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { demo, mode } = await req.json();
    if (!demo || !mode) {
      throw new Error('Missing payload');
    }

    console.log(`[migrate-demo] User ${user.id} migrating with mode: ${mode}`);

    // Normalize incoming demo data
    const incoming = normalizeDemoPayload(demo);

    let result;

    // Handle merge vs replace vs fresh
    if (mode === 'fresh') {
      // Just clear - client will handle redirect
      console.log('[migrate-demo] Fresh start - no data to migrate');
      result = { ok: true, mode: 'fresh' };
    } else if (mode === 'merge') {
      result = await PlanAPI.merge(supabase, user.id, incoming);
      console.log(`[migrate-demo] Merged ${result.debts.length} debts`);
    } else if (mode === 'replace') {
      result = await PlanAPI.replace(supabase, user.id, incoming);
      console.log(`[migrate-demo] Replaced with ${result.debts.length} debts`);
    } else {
      throw new Error('Invalid mode');
    }

    return new Response(
      JSON.stringify({ ok: true, result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[migrate-demo] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function normalizeDemoPayload(demo: any) {
  const debts = Array.isArray(demo?.debts) 
    ? demo.debts.map(sanitizeDebt).filter(Boolean) 
    : [];
  const settings = sanitizeSettings(demo?.settings || {});
  const notes = String(demo?.notes || '');
  return { debts, settings, notes };
}

function sanitizeDebt(d: any) {
  if (!d) return null;
  return {
    id: d.id || `debt_${Math.random().toString(36).slice(2, 9)}`,
    name: String(d.name || 'Debt'),
    balance: toNum(d.balance),
    apr: toNum(d.apr),
    minPayment: toNum(d.minPayment || d.min_payment),
    dueDay: clampInt(d.dueDay || d.due_day || 1, 1, 28),
    include: d.include !== false,
  };
}

function sanitizeSettings(s: any) {
  return {
    strategy: s?.strategy === 'avalanche' ? 'avalanche' : 'snowball',
    extraMonthly: toNum(s?.extraMonthly || s?.extra_monthly),
    oneTimeExtra: toNum(s?.oneTimeExtra || s?.one_time_extra),
  };
}

function toNum(x: any) {
  const n = Number(x);
  return isFinite(n) && n >= 0 ? n : 0;
}

function clampInt(n: any, min: number, max: number) {
  n = Math.floor(Number(n) || min);
  return Math.max(min, Math.min(max, n));
}
