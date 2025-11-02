import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, debtContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

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

GUIDANCE APPROACH:
- Help users understand how to use Finityo's features effectively
- Explain which payoff strategy might work best for their situation
- Encourage users to connect their banks via Plaid for automatic updates
- Provide clear, actionable debt management advice
- Be empathetic and encouraging about their debt journey

Keep your responses:
- Clear and concise (2-3 paragraphs max unless asked for more detail)
- Actionable with specific steps
- Focused on how Finityo can help solve their problems
- Encouraging and supportive

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
