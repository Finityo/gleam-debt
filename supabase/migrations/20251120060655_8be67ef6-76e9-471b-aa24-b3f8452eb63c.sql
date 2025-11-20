-- Create team invites table for secure registration
CREATE TABLE public.team_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'support', 'readonly')),
  token TEXT NOT NULL UNIQUE,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  used_by UUID REFERENCES auth.users(id)
);

-- Index for efficient lookup
CREATE INDEX idx_team_invites_token ON public.team_invites(token) WHERE used_at IS NULL;
CREATE INDEX idx_team_invites_email ON public.team_invites(email);

-- Enable RLS
ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;

-- Create is_team_admin security definer function to avoid recursive RLS
CREATE OR REPLACE FUNCTION public.is_team_admin(_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_access
    WHERE email = _email
    AND role = 'admin'
  )
$$;

-- Admins can view all invites
CREATE POLICY "Admins can view all invites"
ON public.team_invites FOR SELECT
USING (public.is_team_admin(auth.jwt()->>'email'));

-- Admins can create invites
CREATE POLICY "Admins can create invites"
ON public.team_invites FOR INSERT
WITH CHECK (public.is_team_admin(auth.jwt()->>'email'));

-- Admins can update invites (mark as used)
CREATE POLICY "Admins can update invites"
ON public.team_invites FOR UPDATE
USING (public.is_team_admin(auth.jwt()->>'email'));

-- Drop and recreate team_access policies using security definer function
DROP POLICY IF EXISTS "Admins can view team access" ON public.team_access;
DROP POLICY IF EXISTS "Admins can insert team access" ON public.team_access;
DROP POLICY IF EXISTS "Admins can update team access" ON public.team_access;
DROP POLICY IF EXISTS "Admins can delete team access" ON public.team_access;
DROP POLICY IF EXISTS "Users can view their own team access" ON public.team_access;

CREATE POLICY "Admins can view team access"
ON public.team_access FOR SELECT
USING (public.is_team_admin(auth.jwt()->>'email'));

CREATE POLICY "Users can view own access"
ON public.team_access FOR SELECT
USING (email = auth.jwt()->>'email');

CREATE POLICY "Admins can insert team access"
ON public.team_access FOR INSERT
WITH CHECK (public.is_team_admin(auth.jwt()->>'email'));

CREATE POLICY "Admins can update team access"
ON public.team_access FOR UPDATE
USING (public.is_team_admin(auth.jwt()->>'email'));

CREATE POLICY "Admins can delete team access"
ON public.team_access FOR DELETE
USING (public.is_team_admin(auth.jwt()->>'email'));

-- Create rate limiting table for team registration
CREATE TABLE public.team_registration_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  email TEXT,
  success BOOLEAN DEFAULT false,
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_team_reg_ip_time ON public.team_registration_attempts(ip_address, attempted_at);
CREATE INDEX idx_team_reg_email_time ON public.team_registration_attempts(email, attempted_at);

-- Enable RLS (no policies needed, service role only)
ALTER TABLE public.team_registration_attempts ENABLE ROW LEVEL SECURITY;

-- Create table to track welcome emails sent
CREATE TABLE public.welcome_emails_sent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
  email TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.welcome_emails_sent ENABLE ROW LEVEL SECURITY;

-- Users can only see their own welcome email record
CREATE POLICY "Users can view own welcome email record"
ON public.welcome_emails_sent FOR SELECT
USING (user_id = auth.uid());