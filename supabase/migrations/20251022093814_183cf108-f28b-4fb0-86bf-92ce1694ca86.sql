-- Make access_token nullable to transition away from plaintext storage
ALTER TABLE plaid_items ALTER COLUMN access_token DROP NOT NULL;

-- Add comment explaining the transition
COMMENT ON COLUMN plaid_items.access_token IS 'DEPRECATED: Use vault_secret_id instead. This column will be removed after all tokens are migrated to Vault.';