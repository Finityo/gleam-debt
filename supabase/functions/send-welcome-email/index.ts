import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

/**
 * send-welcome-email.ts
 * Fires AFTER a user verifies their email.
 * Lovable Cloud version (Auth webhook handler)
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();

    // Expected Lovable Auth Event:
    // {
    //   "event": "user.email_verified",
    //   "user": { "id": "...", "email": "..." }
    // }
    if (!payload || payload.event !== "user.email_verified") {
      return new Response(
        JSON.stringify({ ok: false, error: "Invalid event" }),
        { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
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
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Send welcome email *only to the verified email*
    await resend.emails.send({
      from: "Finityo <no-reply@finityo.app>",
      to: [email],
      subject: "Welcome to Finityo — Let's Get You Debt Free",
      html: `
        <h2>Welcome, ${name}!</h2>
        <p>Your account is verified and you're all set.</p>
        <p>Finityo is ready to help you finally take control of your debt.</p>
        <br/>
        <p>Let's get started:</p>
        <a href="https://finityo-debt.lovable.app" 
           style="padding:10px 15px;background:#6C47FF;color:white;border-radius:6px;text-decoration:none;">
          Open Finityo
        </a>
        <br/><br/>
        <p>Thanks for joining us,<br/>The Finityo Team</p>
      `,
    });

    return new Response(
      JSON.stringify({ ok: true }),
      { 
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (err: any) {
    console.error("Welcome-email error:", err);
    return new Response(
      JSON.stringify({ ok: false, error: "Internal error" }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
};

serve(handler);
