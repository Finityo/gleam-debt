import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type ShareRequest = {
  card_type?: "streak" | "milestone" | "goal" | "generic";
};

type ShareCardResponse = {
  card_type: string;
  title: string;
  subtitle: string;
  caption: string;
  hashtags: string[];
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
      global: {
        headers: {
          Authorization: req.headers.get("Authorization") ?? ""
        }
      }
    });

    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    const userId = user.id;

    const body: ShareRequest =
      req.method === "POST" ? await req.json() : {};
    let requestedType = body.card_type ?? "generic";

    // get latest milestones + streak
    const { data: milestones, error: msError } = await supabase
      .from("user_milestones")
      .select("title,description,level,achieved_at,code")
      .eq("user_id", userId)
      .order("achieved_at", { ascending: false })
      .limit(1);
    if (msError) throw msError;

    const latestMs = milestones?.[0] ?? null;

    const { data: streakEvents, error: eventsError } = await supabase
      .from("payoff_events")
      .select("event_type,event_date")
      .eq("user_id", userId)
      .order("event_date", { ascending: true });
    if (eventsError) throw eventsError;

    let currentStreak = 0;
    if (streakEvents && streakEvents.length > 0) {
      const monthsSeen = new Set<string>();
      for (const e of streakEvents) {
        const d = new Date(e.event_date);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        monthsSeen.add(key);
      }
      const sortedMonths = Array.from(monthsSeen).sort((a, b) => {
        const [ya, ma] = a.split("-").map(Number);
        const [yb, mb] = b.split("-").map(Number);
        if (ya !== yb) return ya - yb;
        return ma - mb;
      });
      if (sortedMonths.length > 0) {
        let longest = 1;
        let current = 1;
        for (let i = 1; i < sortedMonths.length; i++) {
          const [py, pm] = sortedMonths[i - 1].split("-").map(Number);
          const [cy, cm] = sortedMonths[i].split("-").map(Number);
          const expectedMonth = (pm + 1) % 12;
          const expectedYear = pm === 11 ? py + 1 : py;
          if (cy === expectedYear && cm === expectedMonth) {
            current += 1;
            if (current > longest) longest = current;
          } else {
            current = 1;
          }
        }
        currentStreak = longest;
      }
    }

    // use pace monitor for ahead/behind narrative
    const { data: paceData, error: paceError } =
      await supabase.functions.invoke("pace-monitor", {
        body: {}
      });
    if (paceError) {
      console.error("pace-monitor from share-card error:", paceError);
    }

    let title = "";
    let subtitle = "";
    let caption = "";
    let hashtags = ["#Finityo", "#DebtFreedom", "#DebtSnowball"];

    if (requestedType === "milestone" && latestMs) {
      title = latestMs.title;
      subtitle = latestMs.description ?? "One more step toward debt freedom.";
      caption = `I just unlocked the "${latestMs.title}" milestone with Finityo.\n\nEvery payment is one less thing weighing on my shoulders. On to the next one. 💪`;
      hashtags.push("#Milestone");
    } else if (requestedType === "streak" && currentStreak > 0) {
      title = `${currentStreak}-Month Payoff Streak`;
      subtitle = "Consistent action beats perfect timing.";
      caption = `Holding a ${currentStreak}-month payoff streak using Finityo.\n\nI'm showing up month after month until these balances are gone.`;
      hashtags.push("#Streak", "#Consistency");
    } else if (requestedType === "goal" && paceData) {
      const paceStatus = paceData.pace_status;
      if (paceStatus === "ahead") {
        title = "Ahead of Schedule";
        subtitle =
          "I'm beating my own debt-free timeline with Finityo's plan.";
        caption =
          "My current payoff plan is ahead of my debt-free goal. Sticking to the strategy and letting the snowball grow.";
        hashtags.push("#AheadOfSchedule");
      } else if (paceStatus === "behind") {
        title = "Course Correcting";
        subtitle =
          "I'm behind the original timeline, but the plan is still in motion.";
        caption =
          "Not every month is perfect, but I'm still on the path. Adjusting, regrouping, and staying focused on the long game.";
        hashtags.push("#RealLife", "#StillMoving");
      } else if (paceStatus === "on_track") {
        title = "On Track";
        subtitle =
          "My debt payoff plan is lined up with my target date.";
        caption =
          "Staying on track with my debt payoff plan. No tricks—just consistent payments and a clear roadmap.";
        hashtags.push("#OnTrack");
      } else {
        requestedType = "generic";
      }
    }

    if (requestedType === "generic" || !title) {
      title = "Debt… Under New Management";
      subtitle =
        "Using Finityo to organize, plan, and attack my balances with purpose.";
      caption =
        "I stopped guessing and started using an actual payoff plan. One by one, these debts are getting knocked out.";
      hashtags.push("#MoneyMoves");
    }

    const payload = {
      card_type: requestedType,
      title,
      subtitle,
      caption,
      hashtags
    };

    await supabase.from("share_cards").insert({
      user_id: userId,
      card_type: requestedType,
      title,
      subtitle,
      payload
    });

    const bodyResp: ShareCardResponse = {
      card_type: requestedType,
      title,
      subtitle,
      caption,
      hashtags
    };

    return new Response(JSON.stringify(bodyResp), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    });
  } catch (e) {
    console.error("share-card-generator error:", e);
    return new Response(
      JSON.stringify({ error: (e as Error).message ?? "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
