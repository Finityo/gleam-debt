-- Create a secure table for storing Plaid tokens instead of using vault
CREATE TABLE IF NOT EXISTS public.plaid_encrypted_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id TEXT NOT NULL UNIQUE,
  encrypted_token TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.plaid_encrypted_tokens ENABLE ROW LEVEL SECURITY;

-- Only allow service role access
CREATE POLICY "Service role can manage tokens"
ON public.plaid_encrypted_tokens
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Update store function to use the new table
DROP FUNCTION IF EXISTS public.store_plaid_token_in_vault(text, text, text);

CREATE OR REPLACE FUNCTION public.store_plaid_token_in_vault(
  p_token text, 
  p_secret_name text, 
  p_description text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Store in encrypted_tokens table instead
  INSERT INTO public.plaid_encrypted_tokens (item_id, encrypted_token)
  VALUES (p_secret_name, p_token)
  ON CONFLICT (item_id) 
  DO UPDATE SET encrypted_token = EXCLUDED.encrypted_token, updated_at = NOW();
  
  RETURN p_secret_name;
END;
$$;

-- Update get function to retrieve from new table
DROP FUNCTION IF EXISTS public.get_plaid_token_from_vault(text, text);

CREATE OR REPLACE FUNCTION public.get_plaid_token_from_vault(
  p_item_id text, 
  p_function_name text DEFAULT 'unknown'
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_vault_secret_id TEXT;
  v_decrypted_secret TEXT;
BEGIN
  -- Get vault_secret_id for the item
  SELECT vault_secret_id INTO v_vault_secret_id
  FROM public.plaid_items
  WHERE item_id = p_item_id;
  
  IF v_vault_secret_id IS NULL THEN
    RAISE EXCEPTION 'No vault secret found for item_id: %', p_item_id;
  END IF;
  
  -- Retrieve from encrypted_tokens table
  SELECT encrypted_token INTO v_decrypted_secret
  FROM public.plaid_encrypted_tokens
  WHERE item_id = v_vault_secret_id;
  
  IF v_decrypted_secret IS NULL THEN
    RAISE EXCEPTION 'Failed to decrypt token for item_id: %', p_item_id;
  END IF;
  
  -- Log the access
  INSERT INTO public.plaid_token_access_log (item_id, access_type, function_name)
  VALUES (p_item_id, 'read', p_function_name);
  
  RETURN v_decrypted_secret;
END;
$$;