import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SecurityIssue {
  check_type: string;
  severity: 'info' | 'warn' | 'error' | 'critical';
  description: string;
  metadata?: Record<string, any>;
  auto_fixed: boolean;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔒 Starting daily security correction task...');

    // Create admin client with service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const issues: SecurityIssue[] = [];

    // ============================================
    // 1. Check for users without roles (orphaned)
    // ============================================
    console.log('Checking for users without roles...');
    const { data: usersWithoutRoles, error: roleCheckError } = await supabaseAdmin
      .from('profiles')
      .select('user_id')
      .limit(1000);

    if (roleCheckError) {
      console.error('Error checking user roles:', roleCheckError);
    } else if (usersWithoutRoles) {
      for (const profile of usersWithoutRoles) {
        const { data: roles } = await supabaseAdmin
          .from('user_roles')
          .select('id')
          .eq('user_id', profile.user_id);

        if (!roles || roles.length === 0) {
          issues.push({
            check_type: 'orphaned_user',
            severity: 'error',
            description: `User ${profile.user_id} exists but has no role assigned`,
            metadata: { user_id: profile.user_id },
            auto_fixed: false,
          });
          console.warn(`⚠️ User ${profile.user_id} has no role`);
        }
      }
    }

    // ============================================
    // 2. Check for multiple admin anomalies
    // ============================================
    console.log('Checking for admin role anomalies...');
    const { data: adminUsers, error: adminError } = await supabaseAdmin
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    if (adminError) {
      console.error('Error checking admin roles:', adminError);
    } else if (adminUsers && adminUsers.length > 5) {
      issues.push({
        check_type: 'excessive_admins',
        severity: 'warn',
        description: `Unusual number of admin users detected: ${adminUsers.length}. Review recommended.`,
        metadata: { admin_count: adminUsers.length },
        auto_fixed: false,
      });
      console.warn(`⚠️ ${adminUsers.length} admin users found`);
    }

    // ============================================
    // 3. Check for unencrypted Plaid tokens
    // ============================================
    console.log('Checking for unencrypted Plaid tokens...');
    const { data: unencryptedTokens, error: tokenError } = await supabaseAdmin
      .from('plaid_items')
      .select('id, item_id, user_id')
      .is('vault_secret_id', null);

    if (tokenError) {
      console.error('Error checking Plaid tokens:', tokenError);
    } else if (unencryptedTokens && unencryptedTokens.length > 0) {
      issues.push({
        check_type: 'unencrypted_tokens',
        severity: 'critical',
        description: `${unencryptedTokens.length} Plaid access tokens are stored without encryption. Manual migration required.`,
        metadata: { 
          count: unencryptedTokens.length,
          item_ids: unencryptedTokens.map(t => t.item_id)
        },
        auto_fixed: false,
      });
      console.error(`🚨 ${unencryptedTokens.length} unencrypted Plaid tokens found`);
    }

    // ============================================
    // 4. Check for orphaned Plaid items
    // ============================================
    console.log('Checking for orphaned Plaid items...');
    const { data: plaidItems, error: plaidError } = await supabaseAdmin
      .from('plaid_items')
      .select('id, item_id, user_id');

    if (plaidError) {
      console.error('Error checking Plaid items:', plaidError);
    } else if (plaidItems) {
      for (const item of plaidItems) {
        const { data: userExists } = await supabaseAdmin
          .from('profiles')
          .select('user_id')
          .eq('user_id', item.user_id)
          .maybeSingle();

        if (!userExists) {
          issues.push({
            check_type: 'orphaned_plaid_item',
            severity: 'warn',
            description: `Plaid item ${item.item_id} belongs to deleted user ${item.user_id}`,
            metadata: { item_id: item.item_id, user_id: item.user_id },
            auto_fixed: false,
          });
          console.warn(`⚠️ Orphaned Plaid item: ${item.item_id}`);
        }
      }
    }

    // ============================================
    // 5. Check for expired/stale Plaid items
    // ============================================
    console.log('Checking for stale Plaid item statuses...');
    const { data: staleItems, error: staleError } = await supabaseAdmin
      .from('plaid_item_status')
      .select('item_id, needs_update, updated_at')
      .eq('needs_update', true);

    if (staleError) {
      console.error('Error checking stale items:', staleError);
    } else if (staleItems && staleItems.length > 0) {
      const oldThreshold = new Date();
      oldThreshold.setDate(oldThreshold.getDate() - 30); // 30 days ago

      const veryStale = staleItems.filter(
        item => new Date(item.updated_at) < oldThreshold
      );

      if (veryStale.length > 0) {
        issues.push({
          check_type: 'stale_plaid_connections',
          severity: 'warn',
          description: `${veryStale.length} Plaid connections need update for over 30 days`,
          metadata: { 
            count: veryStale.length,
            item_ids: veryStale.map(i => i.item_id)
          },
          auto_fixed: false,
        });
        console.warn(`⚠️ ${veryStale.length} very stale Plaid connections`);
      }
    }

    // ============================================
    // 6. Log all findings to audit table
    // ============================================
    if (issues.length > 0) {
      console.log(`📝 Logging ${issues.length} security findings...`);
      const { error: logError } = await supabaseAdmin
        .from('security_audit_log')
        .insert(issues);

      if (logError) {
        console.error('Error logging security findings:', logError);
      } else {
        console.log('✅ Security findings logged successfully');
      }
    } else {
      console.log('✅ No security issues detected');
      
      // Log successful scan
      await supabaseAdmin
        .from('security_audit_log')
        .insert({
          check_type: 'daily_scan',
          severity: 'info',
          description: 'Daily security scan completed with no issues found',
          auto_fixed: false,
        });
    }

    // ============================================
    // 7. Summary
    // ============================================
    const summary = {
      timestamp: new Date().toISOString(),
      total_issues: issues.length,
      by_severity: {
        critical: issues.filter(i => i.severity === 'critical').length,
        error: issues.filter(i => i.severity === 'error').length,
        warn: issues.filter(i => i.severity === 'warn').length,
        info: issues.filter(i => i.severity === 'info').length,
      },
      issues: issues,
    };

    console.log('🔒 Security correction task completed');
    console.log('Summary:', JSON.stringify(summary, null, 2));

    return new Response(
      JSON.stringify(summary),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in security correction task:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
