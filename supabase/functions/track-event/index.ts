import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const eventSchema = z.object({
  event_type: z.enum([
    'page_view',
    'signup',
    'login',
    'debt_added',
    'debt_deleted',
    'debt_imported',
    'plan_calculated',
    'bank_connected',
    'bank_disconnected',
    'hero_cta_click',
  ]),
  page_path: z.string().max(200).optional(),
  metadata: z.record(z.any()).optional(),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create admin client for inserting analytics
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Try to get authenticated user (optional)
    let userId = null;
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        {
          global: {
            headers: { Authorization: authHeader },
          },
        }
      );
      const { data: { user } } = await supabaseClient.auth.getUser();
      userId = user?.id || null;
    }

    // Parse and validate request
    const validated = eventSchema.parse(await req.json());
    
    // SECURITY: Limit metadata size to prevent abuse (max 10KB)
    if (validated.metadata) {
      const metadataStr = JSON.stringify(validated.metadata);
      if (metadataStr.length > 10000) {
        return new Response(
          JSON.stringify({ error: 'Metadata too large' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Server-side data collection (client can't manipulate)
    const ipAddress = req.headers.get('x-forwarded-for') || 
                      req.headers.get('x-real-ip') || 
                      'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Rate limit check: max 100 events per hour per IP
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count, error: countError } = await supabaseAdmin
      .from('analytics_events')
      .select('*', { count: 'exact', head: true })
      .eq('ip_address', ipAddress)
      .gte('created_at', oneHourAgo);

    if (countError) {
      console.error('Rate limit check error:', countError);
    } else if (count && count >= 100) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Too many events from this IP.' }),
        {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Insert event with server-controlled fields
    const { error: insertError } = await supabaseAdmin
      .from('analytics_events')
      .insert({
        event_type: validated.event_type,
        user_id: userId,
        page_path: validated.page_path || null,
        metadata: validated.metadata || null,
        ip_address: ipAddress,
        user_agent: userAgent,
      });

    if (insertError) {
      console.error('Analytics insert error:', insertError);
      throw insertError;
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ error: 'Invalid event data', details: error.errors }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.error('Error in track-event:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
