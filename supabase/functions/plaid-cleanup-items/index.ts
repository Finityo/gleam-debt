import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Plaid Item Cleanup Function
 * 
 * Removes stale Plaid Items to prevent unnecessary billing charges,
 * especially for Transactions product which bills monthly per Item.
 * 
 * Cleanup criteria (per Plaid Implementation Handbook):
 * - Users inactive for 60+ days
 * - Items in error state for 30+ days
 * - User account deleted/churned
 * 
 * Recommendation: Run near end of month before billing cycle
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase admin client for cleanup operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Get authenticated user for manual cleanup requests
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
    const isAdmin = user ? await checkAdminRole(supabaseAdmin, user.id) : false;

    const { cleanup_type = 'auto', dry_run = true } = await req.json().catch(() => ({}));

    console.log('Starting Plaid Item cleanup:', { cleanup_type, dry_run, isAdmin });

    const itemsToRemove: any[] = [];
    const now = new Date();

    // 1. Find items from inactive users (60+ days)
    if (cleanup_type === 'auto' || cleanup_type === 'inactive_users') {
      const inactiveCutoff = new Date(now);
      inactiveCutoff.setDate(inactiveCutoff.getDate() - 60);

      const { data: inactiveItems } = await supabaseAdmin
        .from('plaid_items')
        .select(`
          id,
          item_id,
          user_id,
          institution_name,
          created_at,
          updated_at
        `)
        .lt('updated_at', inactiveCutoff.toISOString());

      if (inactiveItems) {
        itemsToRemove.push(...inactiveItems.map((item: any) => ({
          ...item,
          reason: 'inactive_user_60_days',
          days_inactive: Math.floor((now.getTime() - new Date(item.updated_at).getTime()) / (1000 * 60 * 60 * 24))
        })));
      }
    }

    // 2. Find items in error state for 30+ days
    if (cleanup_type === 'auto' || cleanup_type === 'error_items') {
      const errorCutoff = new Date(now);
      errorCutoff.setDate(errorCutoff.getDate() - 30);

      const { data: errorItems } = await supabaseAdmin
        .from('plaid_item_status')
        .select(`
          item_id,
          needs_update,
          update_reason,
          last_webhook_at,
          plaid_items!inner (
            id,
            item_id,
            user_id,
            institution_name,
            created_at,
            updated_at
          )
        `)
        .eq('needs_update', true)
        .lt('last_webhook_at', errorCutoff.toISOString());

      if (errorItems) {
        itemsToRemove.push(...errorItems.map((status: any) => ({
          id: status.plaid_items.id,
          item_id: status.plaid_items.item_id,
          user_id: status.plaid_items.user_id,
          institution_name: status.plaid_items.institution_name,
          created_at: status.plaid_items.created_at,
          updated_at: status.plaid_items.updated_at,
          reason: 'error_state_30_days',
          error_reason: status.update_reason,
          days_in_error: Math.floor((now.getTime() - new Date(status.last_webhook_at).getTime()) / (1000 * 60 * 60 * 24))
        })));
      }
    }

    // Deduplicate by item_id
    const uniqueItems = Array.from(
      new Map(itemsToRemove.map((item: any) => [item.item_id, item])).values()
    );

    console.log(`Found ${uniqueItems.length} items for cleanup`);

    if (dry_run) {
      return new Response(JSON.stringify({
        dry_run: true,
        items_found: uniqueItems.length,
        items: uniqueItems.map((item: any) => ({
          item_id: item.item_id,
          institution: item.institution_name,
          reason: item.reason,
          days_inactive: item.days_inactive,
          days_in_error: item.days_in_error,
        })),
        message: 'Dry run complete. Set dry_run=false to actually remove items.'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Actually remove items (requires admin or service role)
    if (!isAdmin && cleanup_type === 'auto') {
      throw new Error('Automatic cleanup requires admin privileges');
    }

    const PLAID_CLIENT_ID = Deno.env.get('PLAID_CLIENT_ID');
    const PLAID_SECRET = Deno.env.get('PLAID_SECRET');
    const PLAID_ENV = 'production';

    const removedItems = [];
    const failedItems = [];

    for (const item of uniqueItems) {
      try {
        // Get access token
        const { data: accessToken } = await supabaseAdmin.rpc('get_plaid_token_from_vault', {
          p_item_id: item.item_id,
          p_function_name: 'plaid-cleanup-items'
        });

        if (accessToken) {
          // Remove from Plaid
          const plaidResponse = await fetch(`https://${PLAID_ENV}.plaid.com/item/remove`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'PLAID-CLIENT-ID': PLAID_CLIENT_ID!,
              'PLAID-SECRET': PLAID_SECRET!,
            },
            body: JSON.stringify({ access_token: accessToken }),
          });

          if (!plaidResponse.ok) {
            const errorData = await plaidResponse.json();
            console.error('Plaid removal failed:', errorData);
          }
        }

        // Delete from database (cascades to accounts, status, encrypted tokens)
        await supabaseAdmin
          .from('plaid_items')
          .delete()
          .eq('item_id', item.item_id);

        removedItems.push({
          item_id: item.item_id,
          institution: item.institution_name,
          reason: item.reason,
        });

        console.log(`Removed item: ${item.item_id} (${item.reason})`);
      } catch (error: any) {
        console.error(`Failed to remove item ${item.item_id}:`, error);
        failedItems.push({
          item_id: item.item_id,
          institution: item.institution_name,
          error: error.message,
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      removed_count: removedItems.length,
      failed_count: failedItems.length,
      removed_items: removedItems,
      failed_items: failedItems,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in plaid-cleanup-items:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function checkAdminRole(supabase: any, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'admin')
    .single();
  
  return !!data;
}
