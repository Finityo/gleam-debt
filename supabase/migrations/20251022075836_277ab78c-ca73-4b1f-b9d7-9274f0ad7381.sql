-- Schedule daily security correction task at 2:00 AM UTC
-- This calls the edge function we just created
SELECT cron.schedule(
  'daily-security-correction',
  '0 2 * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://jsvduobkznoszmxedkss.supabase.co/functions/v1/security-correction-task',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzdmR1b2Jrem5vc3pteGVka3NzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2OTU0MDQsImV4cCI6MjA3NTI3MTQwNH0.tvjsheUrW4po61UAowqCxsiRCaCe2KlFh1nSxeT8eBE"}'::jsonb,
      body := jsonb_build_object('scheduled', true, 'time', now())
    ) as request_id;
  $$
);