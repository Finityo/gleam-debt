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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    
    if (!user) {
      console.error('Unauthorized link token request - no user');
      throw new Error('Unauthorized');
    }

    // Rate limiting check - 20 attempts per hour, 50 per 24 hours
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: hourlyAttempts } = await supabaseClient
      .from('plaid_rate_limits')
      .select('id')
      .eq('user_id', user.id)
      .eq('action_type', 'create_link_token')
      .gte('attempted_at', oneHourAgo);

    const { data: dailyAttempts } = await supabaseClient
      .from('plaid_rate_limits')
      .select('id')
      .eq('user_id', user.id)
      .eq('action_type', 'create_link_token')
      .gte('attempted_at', oneDayAgo);

    const hourlyCount = hourlyAttempts?.length || 0;
    const dailyCount = dailyAttempts?.length || 0;

    console.log('Rate limit check:', {
      user_id: user.id,
      hourly_attempts: hourlyCount,
      daily_attempts: dailyCount
    });

    if (hourlyCount >= 20) {
      console.warn('Rate limit exceeded (hourly):', {
        user_id: user.id,
        attempts: hourlyCount
      });

      // Log rate limit hit
      await supabaseClient.from('plaid_rate_limits').insert({
        user_id: user.id,
        action_type: 'create_link_token',
        success: false,
        ip_address: req.headers.get('x-forwarded-for') || 'unknown'
      });

      return new Response(
        JSON.stringify({ 
          error: 'Too many connection attempts. Please wait an hour before trying again.',
          retry_after: 3600
        }),
        {
          status: 429,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': '3600'
          },
        }
      );
    }

    if (dailyCount >= 50) {
      console.warn('Rate limit exceeded (daily):', {
        user_id: user.id,
        attempts: dailyCount
      });

      // Log rate limit hit
      await supabaseClient.from('plaid_rate_limits').insert({
        user_id: user.id,
        action_type: 'create_link_token',
        success: false,
        ip_address: req.headers.get('x-forwarded-for') || 'unknown'
      });

      return new Response(
        JSON.stringify({ 
          error: 'Daily connection limit reached. Please try again tomorrow.',
          retry_after: 86400
        }),
        {
          status: 429,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': '86400'
          },
        }
      );
    }

    console.log('Creating link token:', {
      user_id: user.id,
      timestamp: new Date().toISOString()
    });

    const PLAID_CLIENT_ID = Deno.env.get('PLAID_CLIENT_ID');
    const PLAID_SECRET = Deno.env.get('PLAID_SECRET');
    const PLAID_ENV = Deno.env.get('PLAID_ENV') || 'production';
    const WEBHOOK_URL = `${Deno.env.get('SUPABASE_URL')}/functions/v1/plaid-webhook`;

    console.log('Using Plaid environment:', PLAID_ENV);
    console.log('Using webhook URL:', WEBHOOK_URL);

    const response = await fetch(`https://${PLAID_ENV}.plaid.com/link/token/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'PLAID-CLIENT-ID': PLAID_CLIENT_ID!,
        'PLAID-SECRET': PLAID_SECRET!,
      },
      body: JSON.stringify({
        user: {
          client_user_id: user.id,
        },
        client_name: 'Finityo',
        products: ['liabilities'],
        optional_products: ['auth', 'identity'],
        country_codes: ['US'],
        language: 'en',
        webhook: WEBHOOK_URL,
        redirect_uri: null,
        android_package_name: null,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Plaid link token creation failed:', {
        user_id: user.id,
        error_code: data.error_code,
        error_message: data.error_message,
        request_id: data.request_id
      });
      throw new Error(data.error_message || 'Failed to create link token');
    }

    console.log('Link token created successfully:', {
      user_id: user.id,
      expiration: data.expiration,
      timestamp: new Date().toISOString()
    });

    // Log successful token creation
    await supabaseClient.from('plaid_rate_limits').insert({
      user_id: user.id,
      action_type: 'create_link_token',
      success: true,
      ip_address: req.headers.get('x-forwarded-for') || 'unknown'
    });

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Link token creation error:', {
      error_message: error.message,
      error_stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
