-- Clear rate limit records for testing user
DELETE FROM public.plaid_rate_limits 
WHERE user_id = 'ed8bd133-efa8-457b-94e2-a41192420614' 
AND action_type = 'create_link_token';