-- Remove admin role from personal email christian.r.t@outlook.com
DELETE FROM public.user_roles 
WHERE user_id = 'ed8bd133-efa8-457b-94e2-a41192420614' 
AND role = 'admin';