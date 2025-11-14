import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type ActionQueueMode = 'list' | 'create' | 'update';

type ActionQueueRequest = {
  mode: ActionQueueMode;
  label?: string;
  action_type?: string;
  payload?: any;
  id?: string;
  status?: 'open' | 'completed' | 'ignored';
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = user.id;

    const body: ActionQueueRequest =
      req.method === 'POST' ? await req.json() : { mode: 'list' };

    const mode: ActionQueueMode = body.mode ?? 'list';
    console.log('Action queue mode:', mode, 'for user:', userId);

    if (mode === 'list') {
      const { data, error } = await supabase
        .from('coach_actions')
        .select('id,label,action_type,status,created_at,completed_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return new Response(JSON.stringify({ actions: data ?? [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    if (mode === 'create') {
      if (!body.label || !body.action_type) {
        return new Response(
          JSON.stringify({ error: 'label and action_type are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const insertPayload = {
        user_id: userId,
        label: body.label,
        action_type: body.action_type,
        payload: body.payload ?? {},
        status: 'open',
      };

      const { data, error } = await supabase
        .from('coach_actions')
        .insert(insertPayload)
        .select('*')
        .maybeSingle();

      if (error) throw error;

      return new Response(JSON.stringify({ action: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 201,
      });
    }

    if (mode === 'update') {
      if (!body.id || !body.status) {
        return new Response(
          JSON.stringify({ error: 'id and status required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const updatePayload: any = {
        status: body.status,
      };
      if (body.status === 'completed') {
        updatePayload.completed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('coach_actions')
        .update(updatePayload)
        .eq('id', body.id)
        .eq('user_id', userId)
        .select('*')
        .maybeSingle();

      if (error) throw error;

      return new Response(JSON.stringify({ action: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ error: 'Unsupported mode' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('action-queue error:', e);
    return new Response(
      JSON.stringify({ error: (e as Error).message ?? 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
