-- Add expires_at column to public_shares table
ALTER TABLE public.public_shares 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Create index for efficient expiration queries
CREATE INDEX IF NOT EXISTS idx_public_shares_expires_at 
ON public.public_shares(expires_at) 
WHERE expires_at IS NOT NULL;