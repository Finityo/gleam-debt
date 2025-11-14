import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type Milestone = {
  code: string;
  level: 'bronze' | 'silver' | 'gold' | 'platinum';
  title: string;
  description: string;
  achieved_at: string;
};

type MilestonesResponse = {
  milestones: Milestone[];
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

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = user.id;

    // Get payoff events for streaks and debts closed
    const { data: events, error: eventsError } = await supabase
      .from('payoff_events')
      .select('event_type,event_date')
      .eq('user_id', userId)
      .order('event_date', { ascending: true });

    if (eventsError) throw eventsError;

    // Get current milestones
    const { data: existingMs, error: msError } = await supabase
      .from('user_milestones')
      .select('code')
      .eq('user_id', userId);

    if (msError) throw msError;
    const existingCodes = new Set((existingMs ?? []).map((m: any) => m.code));

    const totalEvents = events?.length ?? 0;
    const totalDebtsClosed = events?.filter((e: any) => e.event_type === 'debt_closed').length ?? 0;

    // Build streak months from events
    const monthsSeen = new Set<string>();
    for (const e of events ?? []) {
      const d = new Date(e.event_date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      monthsSeen.add(key);
    }
    const sortedMonths = Array.from(monthsSeen).sort((a, b) => {
      const [ya, ma] = a.split('-').map(Number);
      const [yb, mb] = b.split('-').map(Number);
      if (ya !== yb) return ya - yb;
      return ma - mb;
    });

    let longestStreak = 0;
    if (sortedMonths.length > 0) {
      longestStreak = 1;
      let current = 1;
      for (let i = 1; i < sortedMonths.length; i++) {
        const [py, pm] = sortedMonths[i - 1].split('-').map(Number);
        const [cy, cm] = sortedMonths[i].split('-').map(Number);
        const expectedMonth = (pm + 1) % 12;
        const expectedYear = pm === 11 ? py + 1 : py;
        if (cy === expectedYear && cm === expectedMonth) {
          current += 1;
          if (current > longestStreak) longestStreak = current;
        } else {
          current = 1;
        }
      }
    }

    const nowIso = new Date().toISOString();
    const newMilestones: Omit<Milestone, 'achieved_at'>[] = [];

    const addIfNew = (
      code: string,
      level: Milestone['level'],
      title: string,
      description: string
    ) => {
      if (!existingCodes.has(code)) {
        newMilestones.push({ code, level, title, description });
      }
    };

    // Debts closed milestones
    if (totalDebtsClosed >= 1) {
      addIfNew('first_debt_paid', 'bronze', 'First Debt Paid', 'You paid off your first debt. That first win is huge.');
    }
    if (totalDebtsClosed >= 3) {
      addIfNew('three_debts_paid', 'silver', 'Three Debts Down', 'You have paid off at least three debts on your journey.');
    }
    if (totalDebtsClosed >= 5) {
      addIfNew('five_debts_paid', 'gold', 'Five Debts Paid', 'Five separate debts cleared. You are building serious momentum.');
    }
    if (totalDebtsClosed >= 10) {
      addIfNew('ten_debts_paid', 'platinum', 'Ten Debts Demolished', 'Ten debts removed from your life. That is elite level progress.');
    }

    // Streak milestones
    if (longestStreak >= 3) {
      addIfNew('three_month_streak', 'bronze', 'Three Month Streak', 'You have taken action for three or more months in a row.');
    }
    if (longestStreak >= 6) {
      addIfNew('six_month_streak', 'silver', 'Six Month Streak', 'Six consecutive months of action. That is discipline.');
    }
    if (longestStreak >= 12) {
      addIfNew('twelve_month_streak', 'gold', 'One Year Streak', 'You showed up for a full year. Very few people ever do this.');
    }

    // Event volume
    if (totalEvents >= 25) {
      addIfNew('twentyfive_events', 'silver', '25 Wins Logged', 'You have logged at least 25 payoff events.');
    }
    if (totalEvents >= 50) {
      addIfNew('fifty_events', 'gold', '50 Wins Logged', 'You have logged at least 50 payoff events.');
    }

    // Insert new milestones
    if (newMilestones.length > 0) {
      const insertRows = newMilestones.map((m) => ({
        user_id: userId,
        code: m.code,
        level: m.level,
        title: m.title,
        description: m.description,
        achieved_at: nowIso,
      }));
      await supabase.from('user_milestones').insert(insertRows);
    }

    const { data: fullMilestones, error: fullError } = await supabase
      .from('user_milestones')
      .select('code,level,title,description,achieved_at')
      .eq('user_id', userId)
      .order('achieved_at', { ascending: false });

    if (fullError) throw fullError;

    const body: MilestonesResponse = {
      milestones: (fullMilestones ?? []).map((m: any) => ({
        code: m.code,
        level: m.level,
        title: m.title,
        description: m.description,
        achieved_at: m.achieved_at,
      })),
    };

    return new Response(JSON.stringify(body), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (e) {
    console.error('milestones-engine error:', e);
    return new Response(
      JSON.stringify({ error: (e as Error).message ?? 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
