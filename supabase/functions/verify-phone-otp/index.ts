import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, otp } = await req.json();

    if (!phone || !otp) {
      throw new Error('Phone number and OTP are required');
    }

    // Get IP address for rate limiting
    const ip_address = req.headers.get('x-forwarded-for') || 
                       req.headers.get('x-real-ip') || 
                       'unknown';

    console.log('OTP verification attempt:', { phone, ip_address });

    // Create admin client for rate limit check
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check rate limits
    const { data: rateLimitData, error: rateLimitError } = await supabaseAdmin
      .rpc('check_otp_rate_limit', {
        p_phone: phone,
        p_ip_address: ip_address
      })
      .single();

    if (rateLimitError) {
      console.error('Rate limit check error:', rateLimitError);
      throw new Error('Failed to check rate limits');
    }

    const rateLimitCheck = rateLimitData as { allowed: boolean; attempts_count: number; wait_seconds: number };

    if (!rateLimitCheck.allowed) {
      console.warn('Rate limit exceeded:', { 
        phone, 
        ip_address, 
        attempts: rateLimitCheck.attempts_count 
      });

      // Log failed attempt
      await supabaseAdmin
        .from('otp_verification_attempts')
        .insert({
          phone,
          ip_address,
          success: false,
          failure_reason: 'rate_limit_exceeded'
        });

      return new Response(
        JSON.stringify({ 
          error: 'Too many failed attempts. Please try again in 15 minutes.',
          wait_seconds: rateLimitCheck.wait_seconds
        }),
        {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create regular client for OTP verification (uses anon key)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Verify OTP
    const { data: verifyData, error: verifyError } = await supabaseClient.auth.verifyOtp({
      phone,
      token: otp,
      type: 'sms',
    });

    // Log the attempt
    const attemptLog = {
      phone,
      ip_address,
      success: !verifyError,
      failure_reason: verifyError?.message || null
    };

    await supabaseAdmin
      .from('otp_verification_attempts')
      .insert(attemptLog);

    if (verifyError) {
      console.warn('OTP verification failed:', { 
        phone, 
        error: verifyError.message,
        attempts: rateLimitCheck.attempts_count + 1
      });

      return new Response(
        JSON.stringify({ 
          error: verifyError.message,
          attempts_remaining: 5 - (rateLimitCheck.attempts_count + 1)
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('OTP verification successful:', { phone });

    return new Response(
      JSON.stringify({ 
        success: true,
        session: verifyData.session,
        user: verifyData.user
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in verify-phone-otp:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
