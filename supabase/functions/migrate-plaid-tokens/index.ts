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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
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

    const { item_ids } = await req.json();

    if (!item_ids || !Array.isArray(item_ids) || item_ids.length === 0) {
      throw new Error('item_ids array is required');
    }

    console.log('Token migration initiated for items:', item_ids);

    // Create admin client for vault operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const results = [];

    for (const item_id of item_ids) {
      try {
        // Get the item details (verify user owns it)
        const { data: item, error: itemError } = await supabaseClient
          .from('plaid_items')
          .select('id, item_id, access_token, user_id, vault_secret_id, institution_name')
          .eq('item_id', item_id)
          .eq('user_id', user.id)
          .single();

        if (itemError || !item) {
          results.push({
            item_id,
            status: 'error',
            message: 'Item not found or access denied'
          });
          continue;
        }

        // Check if already migrated
        if (item.vault_secret_id) {
          results.push({
            item_id,
            status: 'skipped',
            message: 'Already encrypted',
            institution: item.institution_name
          });
          continue;
        }

        // Check if has access token
        if (!item.access_token) {
          results.push({
            item_id,
            status: 'error',
            message: 'No access token to migrate'
          });
          continue;
        }

        // Store token in Vault using admin client
        const vaultSecretId = `plaid_token_${item.item_id}`;
        const { data: storedSecretId, error: vaultError } = await supabaseAdmin.rpc('store_plaid_token_in_vault', {
          p_token: item.access_token,
          p_secret_name: vaultSecretId,
          p_description: `Plaid access token for item ${item.item_id} (migrated from plaintext)`
        });

        if (vaultError) {
          console.error('Vault storage error:', vaultError);
          results.push({
            item_id,
            status: 'error',
            message: 'Failed to store in vault',
            error: vaultError.message
          });
          continue;
        }

        // Update plaid_items to reference vault and clear plaintext token
        const { error: updateError } = await supabaseAdmin
          .from('plaid_items')
          .update({
            vault_secret_id: storedSecretId,
            access_token: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id);

        if (updateError) {
          console.error('Update error:', updateError);
          results.push({
            item_id,
            status: 'error',
            message: 'Stored in vault but failed to update record',
            error: updateError.message
          });
          continue;
        }

        // Log the migration
        await supabaseAdmin.from('plaid_token_access_log').insert({
          item_id: item.item_id,
          access_type: 'migrate',
          function_name: 'migrate-plaid-tokens',
          accessed_by: user.id
        });

        results.push({
          item_id,
          status: 'success',
          message: 'Token migrated successfully',
          institution: item.institution_name
        });

        console.log('Token migrated successfully:', {
          item_id,
          institution: item.institution_name
        });

      } catch (error: any) {
        console.error('Migration error for item:', item_id, error);
        results.push({
          item_id,
          status: 'error',
          message: error?.message || 'Unknown error'
        });
      }
    }

    return new Response(
      JSON.stringify({ results }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Migration error:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Migration failed' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
