-- Add vault_secret_id column to plaid_items table
ALTER TABLE public.plaid_items
ADD COLUMN vault_secret_id TEXT;

-- Create function to migrate existing tokens to Vault
CREATE OR REPLACE FUNCTION public.migrate_plaid_tokens_to_vault()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item_record RECORD;
  secret_name TEXT;
BEGIN
  -- Loop through all plaid_items that have access_token but no vault_secret_id
  FOR item_record IN 
    SELECT id, item_id, access_token 
    FROM public.plaid_items 
    WHERE access_token IS NOT NULL 
    AND vault_secret_id IS NULL
  LOOP
    -- Create unique secret name
    secret_name := 'plaid_token_' || item_record.item_id;
    
    -- Store token in Vault
    PERFORM vault.create_secret(
      item_record.access_token,
      secret_name,
      'Plaid access token for item ' || item_record.item_id
    );
    
    -- Update plaid_items with vault reference
    UPDATE public.plaid_items
    SET vault_secret_id = secret_name
    WHERE id = item_record.id;
    
    RAISE NOTICE 'Migrated token for item_id: %', item_record.item_id;
  END LOOP;
  
  RAISE NOTICE 'Migration complete. All tokens moved to Vault.';
END;
$$;

-- Execute the migration immediately
SELECT public.migrate_plaid_tokens_to_vault();

-- Drop the migration function after use
DROP FUNCTION public.migrate_plaid_tokens_to_vault();

-- Add audit logging table for token access
CREATE TABLE IF NOT EXISTS public.plaid_token_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id TEXT NOT NULL,
  accessed_by UUID REFERENCES auth.users(id),
  access_type TEXT NOT NULL, -- 'read', 'create', 'delete'
  function_name TEXT NOT NULL,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on audit log
ALTER TABLE public.plaid_token_access_log ENABLE ROW LEVEL SECURITY;

-- Only allow reading your own access logs
CREATE POLICY "Users can view their own token access logs"
ON public.plaid_token_access_log
FOR SELECT
USING (
  accessed_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.plaid_items 
    WHERE plaid_items.item_id = plaid_token_access_log.item_id 
    AND plaid_items.user_id = auth.uid()
  )
);

-- System can insert logs (from edge functions using service role)
CREATE POLICY "System can insert token access logs"
ON public.plaid_token_access_log
FOR INSERT
WITH CHECK (true);

-- Create helper function to retrieve token from Vault with audit logging
CREATE OR REPLACE FUNCTION public.get_plaid_token_from_vault(
  p_item_id TEXT,
  p_function_name TEXT DEFAULT 'unknown'
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
  
  -- Retrieve secret from Vault
  SELECT decrypted_secret INTO v_decrypted_secret
  FROM vault.decrypted_secrets
  WHERE name = v_vault_secret_id;
  
  IF v_decrypted_secret IS NULL THEN
    RAISE EXCEPTION 'Failed to decrypt token for item_id: %', p_item_id;
  END IF;
  
  -- Log the access
  INSERT INTO public.plaid_token_access_log (item_id, access_type, function_name)
  VALUES (p_item_id, 'read', p_function_name);
  
  RETURN v_decrypted_secret;
END;
$$;

-- After migration is complete, we can drop the access_token column
-- UNCOMMENT THIS AFTER VERIFYING EVERYTHING WORKS:
-- ALTER TABLE public.plaid_items DROP COLUMN access_token;