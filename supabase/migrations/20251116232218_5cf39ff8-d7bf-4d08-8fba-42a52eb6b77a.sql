-- Add name and email columns to support_tickets for contact form
ALTER TABLE public.support_tickets
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS email TEXT;

-- Make user_id nullable for anonymous contact submissions
ALTER TABLE public.support_tickets
ALTER COLUMN user_id DROP NOT NULL;

-- Add policy for anonymous contact form submissions
CREATE POLICY "Anyone can submit contact forms"
ON public.support_tickets
FOR INSERT
WITH CHECK (user_id IS NULL AND name IS NOT NULL AND email IS NOT NULL);

-- Add index for email lookups
CREATE INDEX IF NOT EXISTS idx_support_tickets_email ON public.support_tickets(email);

-- Add index for status filtering
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);