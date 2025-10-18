-- Create wrapper function to store secrets in Vault
CREATE OR REPLACE FUNCTION public.store_plaid_token_in_vault(
  p_token TEXT,
  p_secret_name TEXT,
  p_description TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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