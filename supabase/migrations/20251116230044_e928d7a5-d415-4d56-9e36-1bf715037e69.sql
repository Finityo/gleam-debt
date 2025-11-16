-- Create email_signups table for newsletter subscriptions
CREATE TABLE IF NOT EXISTS public.email_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.email_signups ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (anonymous signups)
CREATE POLICY "Anyone can sign up for newsletter"
  ON public.email_signups
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only authenticated users can view signups (admin feature)
CREATE POLICY "Authenticated users can view signups"
  ON public.email_signups
  FOR SELECT
  TO authenticated
  USING (true);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_signups_email ON public.email_signups(email);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_email_signups_created_at ON public.email_signups(created_at DESC);