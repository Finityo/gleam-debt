-- Add pin_hash column for PIN protection
ALTER TABLE public.public_shares 
ADD COLUMN IF NOT EXISTS pin_hash TEXT;

-- Add index for efficient PIN lookups
CREATE INDEX IF NOT EXISTS idx_public_shares_pin_hash 
ON public.public_shares(pin_hash) 
WHERE pin_hash IS NOT NULL;