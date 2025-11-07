import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

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

    // Get current user data
    const { data: currentDebts } = await supabase
      .from('debts')
      .select('*')
      .eq('user_id', user.id);

    const { data: currentSettings } = await supabase
      .from('settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    let finalDebts = incoming.debts;
    let finalSettings = incoming.settings;

    // Handle merge vs replace
    if (mode === 'merge' && currentDebts) {
      finalDebts = mergeDebts(currentDebts, incoming.debts);
      if (currentSettings) {
        finalSettings = { ...currentSettings, ...incoming.settings };
      }
    } else if (mode === 'replace') {
      // Delete existing debts
      await supabase
        .from('debts')
        .delete()
        .eq('user_id', user.id);
    }

    // Insert/update debts
    const debtsToInsert = finalDebts.map((d: any) => ({
      ...d,
      user_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const { error: debtsError } = await supabase
      .from('debts')
      .upsert(debtsToInsert);

    if (debtsError) throw debtsError;

    // Update settings
    const { error: settingsError } = await supabase
      .from('settings')
      .upsert({
        user_id: user.id,
        ...finalSettings,
        updated_at: new Date().toISOString(),
      });

    if (settingsError) throw settingsError;

    console.log(`[migrate-demo] Successfully migrated ${finalDebts.length} debts`);

    return new Response(
      JSON.stringify({ ok: true }),
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

// Helper functions
function normalizeDemoPayload(demo: any) {
  const debts = Array.isArray(demo?.debts) 
    ? demo.debts.map(sanitizeDebt).filter(Boolean) 
    : [];
  const settings = sanitizeSettings(demo?.settings || {});
  return { debts, settings };
}

function sanitizeDebt(d: any) {
  if (!d) return null;
  return {
    id: d.id || `debt_${Math.random().toString(36).slice(2, 9)}`,
    name: String(d.name || 'Debt'),
    balance: toNum(d.balance),
    apr: toNum(d.apr),
    min_payment: toNum(d.minPayment || d.min_payment),
    due_day: clampInt(d.dueDay || d.due_day || 1, 1, 28),
    debt_type: d.debtType || d.debt_type || 'other',
    notes: d.notes || null,
  };
}

function sanitizeSettings(s: any) {
  return {
    strategy: s?.strategy === 'avalanche' ? 'avalanche' : 'snowball',
    extra_monthly: toNum(s?.extraMonthly || s?.extra_monthly),
    one_time_extra: toNum(s?.oneTimeExtra || s?.one_time_extra),
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

function mergeDebts(current: any[], incoming: any[]) {
  const seen = new Set(
    current.map((d: any) => 
      `${d.name}|${Math.round(d.balance)}|${Math.round(d.apr * 100)}`
    )
  );

  const newDebts = incoming.filter((d: any) => {
    const sig = `${d.name}|${Math.round(d.balance)}|${Math.round(d.apr * 100)}`;
    if (seen.has(sig)) return false;
    seen.add(sig);
    return true;
  });

  return [...current, ...newDebts];
}
