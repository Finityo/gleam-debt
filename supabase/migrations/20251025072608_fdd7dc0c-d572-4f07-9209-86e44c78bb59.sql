-- Fix search_path for security definer functions
ALTER FUNCTION public.store_plaid_token_in_vault(text, text, text) SET search_path = public;
ALTER FUNCTION public.get_plaid_token_from_vault(text, text) SET search_path = public;