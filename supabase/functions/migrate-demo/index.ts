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

    // Get current user plan data
    const { data: currentPlan } = await supabase
      .from('user_plan_data')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    let finalDebts = incoming.debts;
    let finalSettings = incoming.settings;
    let finalNotes = incoming.notes || '';

    // Handle merge vs replace
    if (mode === 'merge' && currentPlan) {
      const currentDebts = currentPlan.debts || [];
      finalDebts = mergeDebts(currentDebts, incoming.debts);
      finalSettings = { ...currentPlan.settings, ...incoming.settings };
      finalNotes = [currentPlan.notes, incoming.notes].filter(Boolean).join('\n\n---\n\n');
    } else if (mode === 'replace') {
      // Replace mode keeps incoming data as-is
      finalDebts = incoming.debts;
      finalSettings = incoming.settings;
      finalNotes = incoming.notes || '';
    }

    // Update user plan data (unified table)
    const { error: planError } = await supabase
      .from('user_plan_data')
      .upsert({
        user_id: user.id,
        debts: finalDebts,
        settings: finalSettings,
        notes: finalNotes,
        plan: null, // Will be recomputed on client
        updated_at: new Date().toISOString(),
      });

    if (planError) throw planError;

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
