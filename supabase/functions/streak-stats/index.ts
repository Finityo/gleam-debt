import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type StreakStatsResponse = {
  current_streak_months: number;
  longest_streak_months: number;
  total_events: number;
  total_debts_closed: number;
  last_event_date: string | null;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = user.id;
    console.log('Computing streak stats for user:', userId);

    const { data: events, error: eventsError } = await supabase
      .from('payoff_events')
      .select('event_type,event_date')
      .eq('user_id', userId)
      .order('event_date', { ascending: true });

    if (eventsError) throw eventsError;

    if (!events || events.length === 0) {
      const empty: StreakStatsResponse = {
        current_streak_months: 0,
        longest_streak_months: 0,
        total_events: 0,
        total_debts_closed: 0,
        last_event_date: null,
      };
      return new Response(JSON.stringify(empty), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const total_events = events.length;
    const total_debts_closed = events.filter(
      (e: any) => e.event_type === 'debt_closed'
    ).length;

    // Group events by month
    const monthsSeen = new Set<string>();
    for (const e of events) {
      const d = new Date(e.event_date);
      const key = `${d.getFullYear()}-${d.getMonth()}`; // year-month index
      monthsSeen.add(key);
    }

    const sortedMonths = Array.from(monthsSeen).sort((a, b) => {
      const [ya, ma] = a.split('-').map(Number);
      const [yb, mb] = b.split('-').map(Number);
      if (ya !== yb) return ya - yb;
      return ma - mb;
    });

    // Compute longest and current streak of consecutive months
    let longest = 1;
    let current = 1;

    for (let i = 1; i < sortedMonths.length; i++) {
      const [py, pm] = sortedMonths[i - 1].split('-').map(Number);
      const [cy, cm] = sortedMonths[i].split('-').map(Number);
      const expectedMonth = (pm + 1) % 12;
      const expectedYear = pm === 11 ? py + 1 : py;

      if (cy === expectedYear && cm === expectedMonth) {
        current += 1;
        if (current > longest) longest = current;
      } else {
        current = 1;
      }
    }

    // Determine if streak is "current" relative to today's month
    const lastKey = sortedMonths[sortedMonths.length - 1];
    const [ly, lm] = lastKey.split('-').map(Number);
    const today = new Date();
    const ty = today.getFullYear();
    const tm = today.getMonth();

    let current_streak_months = 0;
    if (ly === ty && lm === tm) {
      current_streak_months = current;
    } else if (ly === ty && lm === tm - 1) {
      // Last event last month; streak is paused but still "current" historically
      current_streak_months = current;
    } else {
      current_streak_months = 0;
    }

    const lastEventDate = events[events.length - 1].event_date;

    const body: StreakStatsResponse = {
      current_streak_months,
      longest_streak_months: longest,
      total_events,
      total_debts_closed,
      last_event_date: lastEventDate,
    };

    return new Response(JSON.stringify(body), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (e) {
    console.error('streak-stats error:', e);
    return new Response(
      JSON.stringify({ error: (e as Error).message ?? 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
