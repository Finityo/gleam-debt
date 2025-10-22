-- Drop the previous migration function and create a better one
DROP FUNCTION IF EXISTS public.migrate_plaid_tokens_to_vault();

-- Create an improved migration function that uses the existing store function
CREATE OR REPLACE FUNCTION public.migrate_single_plaid_token(p_item_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_item RECORD;
  v_secret_name TEXT;
  v_result JSONB;
BEGIN
  -- Get the item details
  SELECT id, item_id, access_token, user_id, vault_secret_id
  INTO v_item
  FROM public.plaid_items
  WHERE item_id = p_item_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'status', 'error',
      'message', 'Item not found',
      'item_id', p_item_id
    );
  END IF;
  
  -- Check if already migrated
  IF v_item.vault_secret_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'status', 'skipped',
      'message', 'Already encrypted',
      'item_id', p_item_id
    );
  END IF;
  
  -- Check if has access token
  IF v_item.access_token IS NULL OR v_item.access_token = '' THEN
    RETURN jsonb_build_object(
      'status', 'error',
      'message', 'No access token to migrate',
      'item_id', p_item_id
    );
  END IF;
  
  -- Generate unique secret name
  v_secret_name := 'plaid_token_' || v_item.item_id;
  
  -- Store token in Vault using existing function
  BEGIN
    PERFORM public.store_plaid_token_in_vault(
      v_item.access_token,
      v_secret_name,
      'Plaid access token for item ' || v_item.item_id || ' (migrated from plaintext)'
    );
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'status', 'error',
      'message', SQLERRM,
      'item_id', p_item_id
    );
  END;
  
  -- Update plaid_items to reference the vault secret
  UPDATE public.plaid_items
  SET vault_secret_id = v_secret_name,
      access_token = NULL,
      updated_at = NOW()
  WHERE id = v_item.id;
  
  -- Log the migration
  INSERT INTO public.plaid_token_access_log (item_id, access_type, function_name)
  VALUES (v_item.item_id, 'migrate', 'migrate_single_plaid_token');
  
  RETURN jsonb_build_object(
    'status', 'success',
    'message', 'Token migrated successfully',
    'item_id', p_item_id
  );
END;
$$;