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
    
    console.log("Sending welcome email to:", email);

    const emailResponse = await resend.emails.send({
      from: "Finityo <support@finityo-debt.com>",
      to: [email],
      subject: "Welcome to Finityo 🚀 Your Debt-Free Journey Starts Now",
      html: `
        <div style="font-family:Arial, sans-serif; max-width:600px; margin:auto; padding:20px; text-align:center;">
          <img src="https://www.finityo-debt.com/icon512.png" width="120" style="margin-bottom:20px;" />

          <h1 style="color:#111;">Welcome to Finityo!</h1>

          <p style="font-size:16px; line-height:1.6; color:#333;">
            Hi ${name || "there"},<br><br>
            You just took the first step toward becoming debt-free — and that's not small thing.
            We're here to guide you with smart strategies, clear visual tools, and motivation
            every step of the way.
          </p>

          <p style="font-size:16px; line-height:1.6; color:#333;">
            Explore our latest tips and strategies on the blog:<br>
            <a href="https://www.finityo-debt.com/blog" style="color:#0070f3; text-decoration:none;">
              Visit the Finityo Blog →
            </a>
          </p>

          <p style="margin-top:30px; font-size:14px; color:#555;">
            Stay focused. Stay consistent. You've got this.
          </p>
        </div>
      `,
    });

    console.log("Welcome email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, result: emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Welcome email error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
