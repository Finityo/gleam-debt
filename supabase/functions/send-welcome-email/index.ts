import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  name?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name }: WelcomeEmailRequest = await req.json();
    
    if (!email) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing email" }), 
        { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    console.log("Sending welcome email to:", email);

    const result = await resend.emails.send({
      from: "Finityo <support@finityo-debt.com>",
      to: [email],
      subject: "Welcome to Finityo 🚀 Your Debt-Free Journey Starts Now",
      html: `
  <div style="font-family: Arial, sans-serif; background: #f5f5f5; padding: 30px;">
    <div style="max-width: 550px; margin: 0 auto; background: white; border-radius: 14px; padding: 35px; text-align: center;">

      <!-- Logo -->
      <img 
        src="https://finityo-debt.com/finityo-logo-final.png" 
        alt="Finityo" 
        style="width: 120px; margin-bottom: 25px;"
      />

      <!-- Header -->
      <h1 style="font-size: 26px; color: #111; margin-bottom: 10px;">
        Welcome to Finityo 🎉
      </h1>

      <!-- Subheader -->
      <p style="font-size: 16px; color: #444; line-height: 24px;">
        You're officially taking the first step toward becoming debt-free.
        We're excited to walk this journey with you.
      </p>

      <hr style="margin: 30px 0; border: none; border-bottom: 1px solid #eaeaea;" />

      <!-- Motivation section -->
      <p style="font-size: 15px; color: #555; line-height: 22px;">
        Every great comeback starts with a single move — and you just made yours.
        You now have access to tools that help you organize, track, and crush your debt
        with clarity and confidence.
      </p>

      <!-- Button -->
      <a 
        href="https://finityo-debt.com"
        style="
          display: inline-block; 
          margin-top: 20px; 
          background: #111; 
          color: white; 
          padding: 12px 22px; 
          border-radius: 8px; 
          text-decoration: none;
          font-size: 15px;
        "
      >Open Your Dashboard</a>

      <hr style="margin: 30px 0; border: none; border-bottom: 1px solid #eaeaea;" />

      <!-- Blog Section -->
      <h2 style="font-size: 20px; color: #111; margin-bottom: 8px;">Learn & Build Momentum</h2>

      <p style="font-size: 15px; color: #444; margin-bottom: 10px;">
        Start with one of our most popular articles:
      </p>

      <a 
        href="https://finityo-debt.com/blog"
        style="color: #0066ff; font-size: 15px; text-decoration: underline;"
      >Visit the Finityo Blog</a>

      <p style="margin-top: 25px; font-size: 12px; color: #888;">
        No spam. Helpful insights only.
      </p>

    </div>
  </div>
`,
    });

    console.log("Welcome email sent successfully:", result);

    return new Response(
      JSON.stringify({ success: true, result }), 
      { 
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error: any) {
    console.error("Welcome email error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }), 
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
};

serve(handler);
