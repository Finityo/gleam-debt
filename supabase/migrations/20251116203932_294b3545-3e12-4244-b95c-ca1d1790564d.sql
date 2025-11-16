-- Create team_access table for admin portal
CREATE TABLE public.team_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'support', 'readonly')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.team_access ENABLE ROW LEVEL SECURITY;

-- Only admins can view team access
CREATE POLICY "Admins can view team access"
ON public.team_access
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.team_access ta
    WHERE ta.email = auth.jwt()->>'email'
    AND ta.role = 'admin'
  )
);

-- Only admins can insert team members
CREATE POLICY "Admins can insert team members"
ON public.team_access
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.team_access ta
    WHERE ta.email = auth.jwt()->>'email'
    AND ta.role = 'admin'
  )
);

-- Only admins can update team members
CREATE POLICY "Admins can update team members"
ON public.team_access
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.team_access ta
    WHERE ta.email = auth.jwt()->>'email'
    AND ta.role = 'admin'
  )
);

-- Only admins can delete team members
CREATE POLICY "Admins can delete team members"
ON public.team_access
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.team_access ta
    WHERE ta.email = auth.jwt()->>'email'
    AND ta.role = 'admin'
  )
);

-- Create analytics_visits table
CREATE TABLE public.analytics_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip TEXT,
  user_agent TEXT,
  referrer TEXT,
  page_path TEXT
);

-- Enable RLS
ALTER TABLE public.analytics_visits ENABLE ROW LEVEL SECURITY;

-- Anyone can insert visits (for tracking)
CREATE POLICY "Anyone can insert visits"
ON public.analytics_visits
FOR INSERT
WITH CHECK (true);

-- Only team members can view analytics
CREATE POLICY "Team members can view visits"
ON public.analytics_visits
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.team_access ta
    WHERE ta.email = auth.jwt()->>'email'
  )
);

-- Create function to check team access
CREATE OR REPLACE FUNCTION public.has_team_access(check_email TEXT, required_role TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_access
    WHERE email = check_email
    AND (required_role IS NULL OR role = required_role)
  )
$$;

-- Create trigger to update updated_at
CREATE TRIGGER update_team_access_updated_at
BEFORE UPDATE ON public.team_access
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed admin user (get from profiles table)
INSERT INTO public.team_access (email, role)
SELECT 
  (SELECT email FROM auth.users WHERE id = (SELECT user_id FROM public.profiles LIMIT 1)),
  'admin'
WHERE NOT EXISTS (SELECT 1 FROM public.team_access LIMIT 1);

-- Create indexes for performance
CREATE INDEX idx_team_access_email ON public.team_access(email);
CREATE INDEX idx_team_access_role ON public.team_access(role);
CREATE INDEX idx_analytics_visits_timestamp ON public.analytics_visits(timestamp);
CREATE INDEX idx_analytics_visits_page_path ON public.analytics_visits(page_path);