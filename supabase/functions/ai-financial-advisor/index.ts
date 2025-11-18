import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // SECURITY: Authenticate user
    const authHeader = req.headers.get('Authorization');
    console.log('Auth header present:', !!authHeader);
    
    if (!authHeader) {
      console.error('No Authorization header found');
      return new Response(
        JSON.stringify({ error: 'Unauthorized. Please log in to use AI advisor.' }), 
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('Auth error:', authError.message);
    }
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized. Please log in to use AI advisor.' }), 
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    console.log('User authenticated:', user.id);

    const { messages, debtContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Log AI usage for tracking (user_id for accountability)
    console.log(`AI advisor request from user: ${user.id}`);

    // Build system prompt with debt context if available
    let systemPrompt = `You are an expert financial advisor for Finityo, a comprehensive debt management platform. You help users understand and maximize the value of Finityo's features.

ABOUT FINITYO:
Finityo is a powerful debt management platform that helps users take control of their financial future through:

CORE FEATURES:
1. **Debt Tracking & Management**: Track all your debts in one place with detailed information (balance, APR, minimum payments)
2. **Smart Payoff Strategies**: 
   - Snowball Method: Pay off smallest debts first for psychological wins
   - Avalanche Method: Pay off highest interest debts first to save money
   - Custom Plans: Create your own personalized payoff strategy
3. **Plaid Integration**: Automatically import debt information from your financial institutions securely
4. **Visual Progress Tracking**: See your debt payoff journey with interactive charts and timelines
5. **Payoff Calendar**: View month-by-month payment schedules to stay on track
6. **Export & Print**: Download your debt plan as PDF, Excel, or CSV for offline access
7. **Credit Utilization Tracking**: Monitor how your debt affects your credit score

SUBSCRIPTION TIERS:
- **Essential**: Up to 5 debts, basic tracking
- **Ultimate**: Unlimited debts, Plaid integration, exports, priority support
- **Ultimate Plus**: Everything in Ultimate + email newsletters and premium features
- **Trial**: Full access to all features during trial period

VALUE PROPOSITION:
Finityo helps users by:
- Providing clarity on total debt and payoff timelines
- Calculating exactly how much interest they'll save with different strategies
- Automating debt tracking through bank connections
- Visualizing progress to maintain motivation
- Creating actionable, step-by-step payoff plans

EXPERT KNOWLEDGE FROM FINITYO BLOG:

**Snowball vs Avalanche Methods:**
- Snowball: Pay smallest balance first for quick wins and motivation. Best for people who need psychological victories and have multiple small debts.
- Avalanche: Pay highest interest rate first to save the most money mathematically. Best for disciplined people focused on minimizing interest costs.
- Key insight: The best method is the one you'll stick with. Both work if you maintain momentum.

**APR & Interest Calculation:**
- Credit cards charge interest DAILY (APR ÷ 365), not annually
- Example: 20% APR on $5,000 = $2.74/day in interest = ~$82/month
- Paying only minimums leads to compound interest - you pay interest on interest
- Real example: $5,000 at 22% APR with 2% minimum payment = 23 years to payoff, $7,723 in interest paid
- Solution: Even small payment increases make huge differences. $200/month vs $100/month cuts payoff from 23 years to 2.8 years

**Psychology of Debt Payoff:**
- Humans need visible progress to stay motivated - this is why snowball method works despite not being mathematically optimal
- Celebrate small milestones: first debt paid, halfway points, consistent extra payments
- Setbacks are normal - focus on progress, not perfection
- Use visual tracking tools to maintain motivation

**Emergency Fund Strategy:**
- Phase 1: Build $500-1,000 starter fund BEFORE aggressive debt payoff (prevents setbacks)
- Phase 2: Aggressively attack debt while maintaining starter fund
- Phase 3: Build full 3-6 month emergency fund after debt-free
- Never put 100% toward debt with zero savings - emergencies will force you back into debt

**Credit Score Impact:**
- Payment history = 35% of score (most important factor)
- Credit utilization = 30% of score (keep below 30%, ideally below 10%)
- Paying down debt improves utilization ratio and boosts credit score
- Keep old accounts open after payoff to maintain credit history length

**Balance Transfer Considerations:**
- 0% APR promos can save thousands if used correctly
- Watch for 3-5% balance transfer fees
- Must pay off during promotional period (usually 12-18 months)
- Only works if you stop adding new debt

**Debt Consolidation:**
- Personal loans can simplify multiple payments into one
- Only beneficial if new interest rate is lower than weighted average of current debts
- Doesn't reduce total debt - just restructures it
- Risk: Paying off credit cards then using them again doubles the problem

**Behavioral Tips:**
- Automate minimum payments to avoid late fees
- Set up extra automatic payments on payday (before you can spend it)
- Stop using credit cards during payoff period
- Direct windfalls (tax refunds, bonuses) to debt
- Share goals with accountability partner

**How Finityo Helps:**
- Toggle between snowball/avalanche to compare time and money saved
- Import debts automatically via Plaid instead of manual entry
- Visual charts show declining balances and approaching debt-free dates
- Calculate exact interest savings from extra payments
- Track credit utilization in real-time
- Export plans for printing or sharing

GUIDANCE APPROACH:
- Help users understand how to use Finityo's features effectively
- Explain which payoff strategy might work best for their situation
- Encourage users to connect their banks via Plaid for automatic updates
- Provide clear, actionable debt management advice based on proven strategies
- Be empathetic and encouraging about their debt journey
- Reference specific blog topics when relevant to their questions

Keep your responses:
- Clear and concise (2-3 paragraphs max unless asked for more detail)
- Actionable with specific steps
- Focused on how Finityo can help solve their problems
- Encouraging and supportive
- Grounded in the proven strategies from our blog content

IMPORTANT: Always remind users that this is educational information only and they should consult licensed financial professionals for personalized advice.`;

    if (debtContext) {
      systemPrompt += `\n\nUser's Current Debt Situation:
- Total number of debts: ${debtContext.totalDebts}
- Total balance: $${debtContext.totalBalance.toLocaleString()}
- Average APR: ${debtContext.avgAPR}%

Use this context to provide personalized advice when relevant.`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            error: "Rate limit exceeded. Please wait a moment before trying again." 
          }), 
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ 
            error: "AI service credits depleted. Please contact support to add credits." 
          }), 
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI service error. Please try again." }), 
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Stream the response back to client
    return new Response(response.body, {
      headers: { 
        ...corsHeaders, 
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("ai-financial-advisor error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error occurred" 
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
