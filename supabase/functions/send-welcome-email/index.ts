// send-welcome-email.ts — Lovable Cloud (Deno Runtime)

import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@3.2.0";

// Resend API Key stored in Lovable Cloud Environment Variables
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// Basic CORS config for Lovable Auth webhooks
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();

    // Expected payload: { event: "client.email_confirmed", user: { email, name } }
    if (!payload || payload.event !== "client.email_confirmed") {
      return new Response(
        JSON.stringify({ ok: false, error: "Invalid event type" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const email = payload.user?.email;
    const name = payload.user?.name ?? "there";

    if (!email) {
      return new Response(
        JSON.stringify({ ok: false, error: "Missing email" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Send welcome email ONLY to the verified email
    await resend.emails.send({
      from: "Finityo <no-reply@finityo.com>",
      to: [email],
      subject: "Welcome to Finityo — You're Verified!",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Welcome to Finityo, ${name}!</h2>
          <p>Your email is verified and your account is good to go.</p>
          <p>You're now ready to build your personal debt payoff plan.</p>
          <br />
          <a href="https://finityo.app" 
             style="background:#000;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;">
             Open Finityo
          </a>
          <br /><br />
          <p>Thanks for joining us,<br />The Finityo Team</p>
        </div>
      `,
    });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Welcome-email error:", err);
    return new Response(
      JSON.stringify({ ok: false, error: "Internal Error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
