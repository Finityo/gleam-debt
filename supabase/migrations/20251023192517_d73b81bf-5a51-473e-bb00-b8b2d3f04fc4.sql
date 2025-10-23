-- Fix vault permissions by granting to service_role and ensuring proper function ownership

-- Grant vault schema usage to service_role
GRANT USAGE ON SCHEMA vault TO service_role;

-- Make sure the function runs as the owner (postgres) who has vault access
ALTER FUNCTION public.store_plaid_token_in_vault(text, text, text) OWNER TO postgres;

-- Recreate the function to ensure it has all necessary grants
DROP FUNCTION IF EXISTS public.store_plaid_token_in_vault(text, text, text);

CREATE OR REPLACE FUNCTION public.store_plaid_token_in_vault(
  p_token text, 
  p_secret_name text, 
  p_description text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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

-- Set function owner to postgres (who has vault access)
ALTER FUNCTION public.store_plaid_token_in_vault(text, text, text) OWNER TO postgres;

-- Grant execute to service_role (used by edge functions)
GRANT EXECUTE ON FUNCTION public.store_plaid_token_in_vault(text, text, text) TO service_role;