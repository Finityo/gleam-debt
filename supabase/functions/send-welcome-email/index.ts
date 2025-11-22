import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

/**
 * send-welcome-email.ts
 * Fires AFTER a user verifies their email.
 * Lovable Cloud version (webhook handler)
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

    // Send welcome email
    const result = await resend.emails.send({
      from: "Finityo <welcome@finityo.com>",
      to: [email],
      subject: "Welcome to Finityo 🎉",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Welcome to Finityo!</h2>
          <p>Hi ${name},</p>
          <p>Your email has been successfully verified. Your account is now ready.</p>
          <p>You can log in anytime and start building your debt freedom plan.</p>
          <br/>
          <strong>Let's get after it.</strong><br/>
          — The Finityo Team
        </div>
      `,
    });

    console.log("Welcome email sent successfully:", result);

    return new Response(
      JSON.stringify({ ok: true, data: result }),
      { 
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (err: any) {
    console.error("send-welcome-email error:", err);
    return new Response(
      JSON.stringify({ ok: false, error: err.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
};

serve(handler);
