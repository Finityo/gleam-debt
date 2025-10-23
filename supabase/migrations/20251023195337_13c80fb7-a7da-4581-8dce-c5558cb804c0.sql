-- Fix vault storage function permissions
DROP FUNCTION IF EXISTS public.store_plaid_token_in_vault(text, text, text);

CREATE OR REPLACE FUNCTION public.store_plaid_token_in_vault(
  p_token text, 
  p_secret_name text, 
  p_description text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'vault', 'public'
AS $$
DECLARE
  v_secret_id UUID;
BEGIN
  -- Insert secret into Vault with proper encryption
  INSERT INTO vault.secrets (secret, name, description)
  VALUES (p_token, p_secret_name, COALESCE(p_description, 'Plaid access token'))
  RETURNING id INTO v_secret_id;
  
  RETURN p_secret_name;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to store token in Vault: %', SQLERRM;
END;
$$;