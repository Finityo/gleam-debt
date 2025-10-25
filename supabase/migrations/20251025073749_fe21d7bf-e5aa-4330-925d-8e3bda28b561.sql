-- Clear rate limit entries older than 5 minutes to give users a fresh start
-- This is a one-time cleanup to help with testing
DELETE FROM public.plaid_rate_limits 
WHERE attempted_at < NOW() - INTERVAL '5 minutes';