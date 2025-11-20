import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Common weak passwords to reject
const COMMON_PASSWORDS = [
  'password', '123456', '12345678', 'qwerty', 'abc123', 'monkey', '1234567', 
  'letmein', 'trustno1', 'dragon', 'baseball', 'iloveyou', 'master', 'sunshine',
  'ashley', 'bailey', 'passw0rd', 'shadow', '123123', '654321', 'superman',
  'qazwsx', 'michael', 'football'
];

interface PasswordValidation {
  valid: boolean;
  error?: string;
}

function validateStrongPassword(password: string, email: string): PasswordValidation {
  // Minimum 10 characters
  if (password.length < 10) {
    return { valid: false, error: 'Password must be at least 10 characters long' };
  }

  // Check for email prefix
  const emailPrefix = email.split('@')[0].toLowerCase();
  if (password.toLowerCase().includes(emailPrefix)) {
    return { valid: false, error: 'Password cannot contain your email address' };
  }

  // Check against common passwords
  if (COMMON_PASSWORDS.includes(password.toLowerCase())) {
    return { valid: false, error: 'Password is too common. Please choose a stronger password' };
  }

  // Must contain at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter' };
  }

  // Must contain at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one lowercase letter' };
  }

  // Must contain at least one number
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number' };
  }

  // Must contain at least one special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one special character' };
  }

  return { valid: true };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create admin client with service role to bypass RLS
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get client IP for rate limiting
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    
    // Get request body
    const { token, password, first_name, last_name } = await req.json();

    console.log('Team registration attempt from IP:', clientIP);

    // 1. VALIDATE INVITE TOKEN IS PROVIDED
    if (!token) {
      // Log failed attempt
      await supabaseAdmin.from('team_registration_attempts').insert({
        ip_address: clientIP,
        email: null,
        success: false
      });

      return new Response(
        JSON.stringify({ error: 'Invite token is required for team registration' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. RATE LIMITING - Check recent attempts from this IP
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    const { data: recentAttempts } = await supabaseAdmin
      .from('team_registration_attempts')
      .select('id')
      .eq('ip_address', clientIP)
      .gte('attempted_at', oneHourAgo);

    if ((recentAttempts?.length || 0) >= 3) {
      console.warn('Rate limit exceeded for IP:', clientIP);
      return new Response(
        JSON.stringify({ error: 'Too many registration attempts. Please try again in 1 hour.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. VALIDATE AND CONSUME INVITE TOKEN
    const { data: invite, error: inviteError } = await supabaseAdmin
      .from('team_invites')
      .select('*')
      .eq('token', token)
      .is('used_at', null)
      .gte('expires_at', new Date().toISOString())
      .single();

    if (inviteError || !invite) {
      console.warn('Invalid or expired invite token:', token);
      
      // Log failed attempt
      await supabaseAdmin.from('team_registration_attempts').insert({
        ip_address: clientIP,
        email: null,
        success: false
      });

      return new Response(
        JSON.stringify({ error: 'Invalid or expired invite token' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { email, role } = invite;

    // 4. VALIDATE PASSWORD IS PROVIDED
    if (!password) {
      await supabaseAdmin.from('team_registration_attempts').insert({
        ip_address: clientIP,
        email: email,
        success: false
      });

      return new Response(
        JSON.stringify({ error: 'Password is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. STRONG PASSWORD VALIDATION
    const passwordValidation = validateStrongPassword(password, email);
    if (!passwordValidation.valid) {
      await supabaseAdmin.from('team_registration_attempts').insert({
        ip_address: clientIP,
        email: email,
        success: false
      });

      return new Response(
        JSON.stringify({ error: passwordValidation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Valid invite found for email:', email, 'with role:', role);

    // 6. CHECK IF USER ALREADY EXISTS
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
      // 7. CREATE NEW USER
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
        
        await supabaseAdmin.from('team_registration_attempts').insert({
          ip_address: clientIP,
          email: email,
          success: false
        });

        return new Response(
          JSON.stringify({ error: createError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('User created successfully:', newUser.user.id);
      userId = newUser.user.id;
      isNewUser = true;
    }

    // 8. ADD USER TO TEAM_ACCESS (using role from invite, not from request)
    const { error: teamAccessError } = await supabaseAdmin
      .from('team_access')
      .insert({
        email: email.toLowerCase(),
        role: role, // Use role from invite token
      });

    if (teamAccessError) {
      console.error('Team access insert error:', teamAccessError);
      
      // If team_access fails and it's a new user, clean up
      if (isNewUser) {
        await supabaseAdmin.auth.admin.deleteUser(userId);
      }

      await supabaseAdmin.from('team_registration_attempts').insert({
        ip_address: clientIP,
        email: email,
        success: false
      });

      return new Response(
        JSON.stringify({ error: 'Failed to grant team access: ' + teamAccessError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 9. MARK INVITE AS USED
    await supabaseAdmin
      .from('team_invites')
      .update({ 
        used_at: new Date().toISOString(),
        used_by: userId 
      })
      .eq('id', invite.id);

    // 10. LOG SUCCESSFUL ATTEMPT
    await supabaseAdmin.from('team_registration_attempts').insert({
      ip_address: clientIP,
      email: email,
      success: true
    });

    console.log('Team access granted successfully to:', email);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: isNewUser 
          ? 'Registration successful! You can now sign in.' 
          : 'Team access granted! You can now sign in with your existing credentials.',
        user: { 
          id: userId, 
          email: email,
          role: role // Return role from invite
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
