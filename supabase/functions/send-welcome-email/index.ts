import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  firstName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, firstName }: WelcomeEmailRequest = await req.json();
    
    console.log("Sending welcome email to:", email);

    const emailResponse = await resend.emails.send({
      from: "Finityo <onboarding@resend.dev>",
      to: [email],
      subject: "Welcome to Finityo — Your First Move Toward Freedom",
      html: `
        <div style="font-family: Helvetica, Arial, sans-serif; padding: 30px; max-width: 640px; margin: auto; background: #ffffff; color: #111;">

          <!-- Logo -->
          <div style="text-align: center; margin-bottom: 25px;">
            <img src="https://finityo-debt.com/logo.png" alt="Finityo Logo" style="width:130px; border-radius: 24px;">
          </div>

          <!-- Heading -->
          <h1 style="text-align: center; font-size: 28px; margin-bottom: 10px; color: #111;">
            Welcome to Finityo${firstName ? `, ${firstName}` : ''}
          </h1>

          <p style="font-size: 16px; line-height: 1.6; text-align: center; margin-bottom: 20px;">
            You just made your first move toward becoming debt-free — and that's a big deal.
          </p>

          <p style="font-size: 16px; line-height: 1.6; text-align: center; margin-bottom: 25px;">
            Finityo gives you a clear payoff plan, a freedom date, and the tools to build momentum.  
            You're not doing this alone — the system is built to guide you step-by-step.
          </p>

          <!-- CTA Buttons -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://finityo-debt.com/setup/start"
               style="background:#6C3DF5; color:#fff; padding:14px 28px; border-radius:10px; 
                      font-size:16px; text-decoration:none; display:inline-block; margin-bottom:10px;">
              Get Started
            </a>
            <br>
            <a href="https://finityo-debt.com/blog"
               style="color:#6C3DF5; font-size:15px; text-decoration:none;">
              Explore the Blog
            </a>
          </div>

          <!-- Divider -->
          <hr style="border:0; border-top:1px solid #eee; margin:30px 0;">

          <!-- What to Do Next -->
          <h2 style="font-size:20px; margin-bottom:10px;">Your Next Steps</h2>
          <ul style="font-size:16px; line-height:1.7; padding-left:20px; color:#333;">
            <li>Connect your bank with Plaid (Ultimate plan)</li>
            <li>Add your debts manually or via import</li>
            <li>Choose Snowball, Avalanche, or AI Hybrid</li>
            <li>See your exact debt-free date</li>
            <li>Check your payoff calendar and track progress</li>
          </ul>

          <!-- Blog CTA -->
          <div style="margin-top: 25px;">
            <p style="font-size: 16px; line-height: 1.6;">
              Want real tips and strategies while you build your plan?
              Our blog has simple breakdowns you can put to use immediately:
            </p>

            <a href="https://finityo-debt.com/blog"
               style="display:inline-block; margin-top:10px; font-size:15px; color:#0d6efd; text-decoration:none;">
              ➜ Visit the Finityo Blog
            </a>
          </div>

          <!-- Footer -->
          <p style="font-size:13px; text-align:center; margin-top:40px; color:#888;">
            Finityo — Debt Simplified <br>
            © 2024 Finityo. All rights reserved.
          </p>
        </div>
      `,
    });

    console.log("Welcome email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-welcome-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
