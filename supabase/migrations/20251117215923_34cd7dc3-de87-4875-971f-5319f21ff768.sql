-- Add appearance_settings column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS appearance_settings JSONB DEFAULT '{
  "glassBlur": "standard",
  "transparency": "standard",
  "accentColor": "purple",
  "motionEnabled": true
}'::jsonb;