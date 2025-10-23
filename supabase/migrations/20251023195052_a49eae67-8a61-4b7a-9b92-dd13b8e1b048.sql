-- Clear rate limit records from the last hour for testing
DELETE FROM public.plaid_rate_limits
WHERE user_id = 'ed8bd133-efa8-457b-94e2-a41192420614'
  AND attempted_at > NOW() - INTERVAL '1 hour';