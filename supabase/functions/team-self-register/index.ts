import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create admin client with service role to bypass RLS
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get request body
    const { email, password, role, first_name, last_name } = await req.json();

    console.log('Self-registration attempt for email:', email, 'with role:', role);

    // Validate inputs
    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 6 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!['admin', 'support', 'readonly'].includes(role)) {
      return new Response(
        JSON.stringify({ error: 'Invalid role. Must be admin, support, or readonly' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user already exists in auth
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users.find(u => u.email?.toLowerCase() === email.toLowerCase());

    let userId: string;
    let isNewUser = false;

    if (existingUser) {
      console.log('User already exists:', existingUser.id);
      userId = existingUser.id;
      
      // Check if already in team_access
      const { data: existingAccess } = await supabaseAdmin
        .from('team_access')
        .select('*')
        .eq('email', email.toLowerCase())
        .single();

      if (existingAccess) {
        return new Response(
          JSON.stringify({ 
            error: 'This email is already registered with team access. Please sign in instead.',
            canSignIn: true
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Adding existing user to team_access');
    } else {
      // Create new user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          first_name: first_name || '',
          last_name: last_name || '',
        }
      });

      if (createError) {
        console.error('User creation error:', createError);
        return new Response(
          JSON.stringify({ error: createError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('User created successfully:', newUser.user.id);
      userId = newUser.user.id;
      isNewUser = true;
    }

    // Add user to team_access table (using service role to bypass RLS)
    const { error: teamAccessError } = await supabaseAdmin
      .from('team_access')
      .insert({
        email: email.toLowerCase(),
        role: role,
      });

    if (teamAccessError) {
      console.error('Team access insert error:', teamAccessError);
      // If team_access fails and it's a new user, delete them
      if (isNewUser) {
        await supabaseAdmin.auth.admin.deleteUser(userId);
      }
      return new Response(
        JSON.stringify({ error: 'Failed to grant team access: ' + teamAccessError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Team access granted successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: isNewUser 
          ? 'Registration successful! You can now sign in.' 
          : 'Team access granted! You can now sign in with your existing credentials.',
        user: { 
          id: userId, 
          email: email,
          role 
        } 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error in team-self-register:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
