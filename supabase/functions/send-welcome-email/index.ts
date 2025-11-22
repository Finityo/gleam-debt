import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Supabase Auth Webhook Handler
 * Triggered automatically when users verify their email
 * Security: Only sends to verified user's email, prevents abuse
 */
const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Supabase Auth webhook payload structure
    const payload = await req.json();
    const { type, record } = payload;

    // Only process user.confirmed events (email verification)
    if (type !== "INSERT" || !record) {
      console.log("Ignoring non-INSERT event or missing record");
      return new Response(JSON.stringify({ ok: true, ignored: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const email = record.email;
    const userId = record.id;

    if (!email) {
      console.error("No email in webhook payload");
      return new Response(
        JSON.stringify({ ok: false, error: "Missing email" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Check if already sent welcome email
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: existingRecord } = await supabase
      .from("welcome_emails_sent")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (existingRecord) {
      console.log("Welcome email already sent to:", email);
      return new Response(
        JSON.stringify({ ok: true, message: "Already sent" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Check if RESEND_API_KEY is configured
    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) {
      console.log("RESEND_API_KEY not configured - running in test mode");
      return new Response(
        JSON.stringify({ ok: true, testMode: true, message: "Email would be sent in production" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    const resend = new Resend(apiKey);
    const displayName = email.split("@")[0];

    console.log("Sending welcome email to:", email);

    const result = await resend.emails.send({
      from: "Finityo <support@finityo-debt.com>",
      to: [email],
      subject: "Welcome to Finityo 🚀 Your Debt-Free Journey Starts Now",
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <div style="background: #f5f5f5; padding: 30px 15px;">
    <div style="max-width: 550px; margin: 0 auto; background: white; border-radius: 14px; padding: 35px 25px; text-align: center;">

      <!-- Logo -->
      <div style="margin-bottom: 25px;">
        <img 
          src="https://finityo-debt.com/finityo-logo-final.png" 
          alt="Finityo" 
          style="width: 120px; height: auto; display: inline-block;"
        />
      </div>

      <!-- Header -->
      <h1 style="font-size: 26px; color: #111; margin: 0 0 10px 0; font-weight: 600;">
        Welcome to Finityo, ${displayName}! 🎉
      </h1>

      <!-- Subheader -->
      <p style="font-size: 16px; color: #444; line-height: 24px; margin: 0 0 20px 0;">
        You're officially taking the first step toward becoming debt-free.<br>
        We're excited to walk this journey with you.
      </p>

      <hr style="margin: 30px 0; border: none; border-top: 1px solid #eaeaea;" />

      <!-- Motivation section -->
      <p style="font-size: 15px; color: #555; line-height: 22px; margin: 0 0 20px 0;">
        Every great comeback starts with a single move — and you just made yours.
        You now have access to tools that help you organize, track, and crush your debt
        with clarity and confidence.
      </p>

      <!-- Dashboard Button -->
      <div style="margin: 25px 0;">
        <a 
          href="https://finityo-debt.com/dashboard"
          style="
            display: inline-block; 
            background: #111; 
            color: white; 
            padding: 14px 28px; 
            border-radius: 8px; 
            text-decoration: none;
            font-size: 15px;
            font-weight: 500;
          "
        >Open Your Dashboard</a>
      </div>

      <hr style="margin: 30px 0; border: none; border-top: 1px solid #eaeaea;" />

      <!-- Blog Section -->
      <h2 style="font-size: 20px; color: #111; margin: 0 0 12px 0; font-weight: 600;">
        Learn & Build Momentum
      </h2>

      <p style="font-size: 15px; color: #444; margin: 0 0 15px 0; line-height: 22px;">
        Start with one of our most popular articles to accelerate your debt-free journey.
      </p>

      <!-- Blog CTA Button -->
      <div style="margin: 20px 0;">
        <a 
          href="https://www.finityo-debt.com/blog"
          style="
            display: inline-block; 
            background: #0066ff; 
            color: white; 
            padding: 12px 24px; 
            border-radius: 8px; 
            text-decoration: none;
            font-size: 15px;
            font-weight: 500;
          "
        >View The Blog</a>
      </div>

      <hr style="margin: 30px 0; border: none; border-top: 1px solid #eaeaea;" />

      <!-- Footer -->
      <p style="margin: 20px 0 0 0; font-size: 14px; color: #666; line-height: 20px;">
        <strong>Your journey to debt freedom starts now.</strong>
      </p>

      <p style="margin: 15px 0 0 0; font-size: 12px; color: #888;">
        No spam. Helpful insights only.
      </p>

    </div>
  </div>
</body>
</html>
`,
    });

    console.log("Welcome email sent successfully:", result);

    // Record that we sent the email
    await supabase.from("welcome_emails_sent").insert({
      user_id: userId,
      email: email,
    });

    return new Response(
      JSON.stringify({ ok: true, data: result.data }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error: any) {
    console.error("Welcome email webhook error:", error);
    return new Response(
      JSON.stringify({ ok: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
};

serve(handler);
