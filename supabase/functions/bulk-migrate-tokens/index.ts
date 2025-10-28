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
    // Create admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting bulk token migration...');

    // Get all unmigrated items
    const { data: unmigratedItems, error: fetchError } = await supabaseAdmin
      .from('plaid_items')
      .select('id, item_id, access_token, user_id, institution_name, vault_secret_id')
      .is('vault_secret_id', null)
      .not('access_token', 'is', null);

    if (fetchError) {
      console.error('Error fetching unmigrated items:', fetchError);
      throw fetchError;
    }

    if (!unmigratedItems || unmigratedItems.length === 0) {
      console.log('No tokens to migrate');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No tokens require migration',
          migrated: 0,
          total: 0 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`Found ${unmigratedItems.length} tokens to migrate`);

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    // Migrate each token
    for (const item of unmigratedItems) {
      try {
        console.log(`Migrating token for item: ${item.item_id} (${item.institution_name})`);

        // Store token in Vault
        const vaultSecretId = `plaid_token_${item.item_id}`;
        const { data: storedSecretId, error: vaultError } = await supabaseAdmin.rpc('store_plaid_token_in_vault', {
          p_token: item.access_token,
          p_secret_name: vaultSecretId,
          p_description: `Plaid access token for item ${item.item_id} (bulk migration)`
        });

        if (vaultError) {
          console.error(`Vault storage error for ${item.item_id}:`, vaultError);
          errorCount++;
          results.push({
            item_id: item.item_id,
            institution: item.institution_name,
            status: 'error',
            message: vaultError.message
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
          console.error(`Update error for ${item.item_id}:`, updateError);
          errorCount++;
          results.push({
            item_id: item.item_id,
            institution: item.institution_name,
            status: 'error',
            message: updateError.message
          });
          continue;
        }

        // Log the migration
        await supabaseAdmin.from('plaid_token_access_log').insert({
          item_id: item.item_id,
          access_type: 'migrate',
          function_name: 'bulk-migrate-tokens',
          accessed_by: item.user_id
        });

        successCount++;
        results.push({
          item_id: item.item_id,
          institution: item.institution_name,
          user_id: item.user_id,
          status: 'success',
          message: 'Token migrated successfully'
        });

        console.log(`✓ Successfully migrated: ${item.item_id}`);

      } catch (error: any) {
        console.error(`Migration error for item ${item.item_id}:`, error);
        errorCount++;
        results.push({
          item_id: item.item_id,
          institution: item.institution_name,
          status: 'error',
          message: error?.message || 'Unknown error'
        });
      }
    }

    const summary = {
      success: true,
      total: unmigratedItems.length,
      migrated: successCount,
      errors: errorCount,
      results
    };

    console.log('Bulk migration complete:', summary);

    return new Response(
      JSON.stringify(summary),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Bulk migration error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error?.message || 'Bulk migration failed' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
