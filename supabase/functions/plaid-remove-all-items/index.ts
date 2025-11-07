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
      throw new Error('Unauthorized');
    }

    // Get all items for this user
    const { data: items, error: fetchError } = await supabaseClient
      .from('plaid_items')
      .select('id, item_id, institution_name')
      .eq('user_id', user.id);

    if (fetchError) {
      console.error('Error fetching items:', fetchError);
      throw fetchError;
    }

    if (!items || items.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No connected accounts to remove',
          removed_count: 0 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    let removedCount = 0;
    const errors: any[] = [];

    // Remove each item from Plaid and database
    for (const item of items) {
      try {
        // Call the existing plaid-remove-item function
        const { error: removeError } = await supabaseClient.functions.invoke('plaid-remove-item', {
          body: { item_id: item.item_id },
        });

        if (removeError) {
          console.error(`Failed to remove item ${item.item_id}:`, removeError);
          errors.push({
            item_id: item.item_id,
            institution_name: item.institution_name,
            error: removeError.message
          });
        } else {
          removedCount++;
          console.log(`Successfully removed item: ${item.item_id} (${item.institution_name})`);
        }
      } catch (error: any) {
        console.error(`Exception removing item ${item.item_id}:`, error);
        errors.push({
          item_id: item.item_id,
          institution_name: item.institution_name,
          error: error.message
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        message: `Removed ${removedCount} of ${items.length} connected accounts`,
        removed_count: removedCount,
        total_items: items.length,
        errors: errors.length > 0 ? errors : undefined
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in plaid-remove-all-items:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
