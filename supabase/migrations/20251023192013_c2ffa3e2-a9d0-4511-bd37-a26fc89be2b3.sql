-- Fix vault storage permissions for store_plaid_token_in_vault function

-- Grant necessary permissions to postgres role for vault operations
GRANT USAGE ON SCHEMA vault TO postgres;

-- Recreate the function with proper permissions
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

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.store_plaid_token_in_vault(text, text, text) TO postgres;
GRANT EXECUTE ON FUNCTION public.store_plaid_token_in_vault(text, text, text) TO service_role;