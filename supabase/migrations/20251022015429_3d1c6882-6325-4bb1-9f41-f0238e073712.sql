-- Fix vault permissions for storing Plaid tokens
-- The issue is that the function needs access to vault schema functions

-- Drop and recreate the function with proper search_path
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
  -- Insert secret into Vault
  INSERT INTO vault.secrets (secret, name, description)
  VALUES (p_token, p_secret_name, p_description)
  RETURNING id INTO v_secret_id;
  
  RETURN p_secret_name;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to store token in Vault: %', SQLERRM;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.store_plaid_token_in_vault(text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.store_plaid_token_in_vault(text, text, text) TO service_role;