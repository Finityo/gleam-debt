-- Drop the previous migration function and create a corrected version
DROP FUNCTION IF EXISTS public.migrate_plaid_tokens_to_vault();

-- Create improved migration function that uses the existing secure RPC
CREATE OR REPLACE FUNCTION public.migrate_plaid_tokens_to_vault()
RETURNS TABLE (
  migrated_count INTEGER,
  failed_count INTEGER,
  details JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_item RECORD;
  v_migrated INTEGER := 0;
  v_failed INTEGER := 0;
  v_secret_name TEXT;
  v_details JSONB := '[]'::JSONB;
  v_stored_name TEXT;
BEGIN
  -- Loop through all items that need migration
  FOR v_item IN 
    SELECT id, item_id, access_token, user_id
    FROM public.plaid_items
    WHERE vault_secret_id IS NULL 
      AND access_token IS NOT NULL
      AND access_token != ''
  LOOP
    BEGIN
      -- Generate unique secret name
      v_secret_name := 'plaid_token_' || v_item.item_id;
      
      -- Use the existing secure RPC to store in Vault
      SELECT public.store_plaid_token_in_vault(
        v_item.access_token,
        v_secret_name,
        'Plaid access token for item ' || v_item.item_id || ' (migrated from plaintext)'
      ) INTO v_stored_name;
      
      -- Update plaid_items to reference the vault secret and clear plaintext
      UPDATE public.plaid_items
      SET vault_secret_id = v_stored_name,
          access_token = NULL,
          updated_at = NOW()
      WHERE id = v_item.id;
      
      -- Log the migration
      INSERT INTO public.plaid_token_access_log (item_id, access_type, function_name)
      VALUES (v_item.item_id, 'migrate', 'migrate_plaid_tokens_to_vault');
      
      v_migrated := v_migrated + 1;
      v_details := v_details || jsonb_build_object(
        'item_id', v_item.item_id,
        'status', 'success',
        'vault_id', v_stored_name
      );
      
    EXCEPTION WHEN OTHERS THEN
      v_failed := v_failed + 1;
      v_details := v_details || jsonb_build_object(
        'item_id', v_item.item_id,
        'status', 'failed',
        'error', SQLERRM
      );
      -- Continue with next item
    END;
  END LOOP;
  
  RETURN QUERY SELECT v_migrated, v_failed, v_details;
END;
$$;