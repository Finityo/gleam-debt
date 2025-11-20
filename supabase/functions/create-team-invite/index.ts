import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InviteRequest {
  email: string;
  role: 'admin' | 'support' | 'readonly';
  expiresInDays?: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Authentication failed:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin using has_team_access function
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: isAdmin, error: checkError } = await supabaseAdmin
      .rpc('has_team_access', { 
        check_email: user.email || '',
        required_role: 'admin' 
      });

    if (checkError || !isAdmin) {
      console.error('Admin check failed:', checkError);
      return new Response(
        JSON.stringify({ error: 'Admin privileges required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { email, role, expiresInDays = 7 }: InviteRequest = await req.json();

    // Validate inputs
    if (!email || !email.includes('@') || email.length > 255) {
      return new Response(
        JSON.stringify({ error: 'Invalid email address' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!['admin', 'support', 'readonly'].includes(role)) {
      return new Response(
        JSON.stringify({ error: 'Invalid role. Must be admin, support, or readonly' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (expiresInDays < 1 || expiresInDays > 30) {
      return new Response(
        JSON.stringify({ error: 'Expiration must be between 1 and 30 days' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if email already has team access
    const { data: existingAccess } = await supabaseAdmin
      .from('team_access')
      .select('email, role')
      .eq('email', email)
      .single();

    if (existingAccess) {
      return new Response(
        JSON.stringify({ 
          error: `Email ${email} already has team access with role: ${existingAccess.role}` 
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate secure random token
    const tokenBytes = new Uint8Array(32);
    crypto.getRandomValues(tokenBytes);
    const token = Array.from(tokenBytes, b => b.toString(16).padStart(2, '0')).join('');

    // Calculate expiration
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    // Create invite
    const { data: invite, error: insertError } = await supabaseAdmin
      .from('team_invites')
      .insert({
        email,
        role,
        token,
        created_by: user.id,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to create invite:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create invite' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Invite created by ${user.email} for ${email} with role ${role}`);

    // Return invite details (token should be sent to user via email, not returned directly)
    return new Response(
      JSON.stringify({
        success: true,
        invite: {
          id: invite.id,
          email: invite.email,
          role: invite.role,
          expires_at: invite.expires_at,
          invite_link: `${req.headers.get('origin') || 'https://app.finityo.com'}/team/register?token=${token}`,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error creating team invite:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
