-- Grant vault access permissions for token storage
-- This allows the store_plaid_token_in_vault function to use vault encryption

-- Grant usage on vault schema to postgres role (used by SECURITY DEFINER functions)
GRANT USAGE ON SCHEMA vault TO postgres;

-- Grant insert permission on vault.secrets table
GRANT INSERT ON vault.secrets TO postgres;

-- Grant usage on the sequence for generating IDs
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA vault TO postgres;