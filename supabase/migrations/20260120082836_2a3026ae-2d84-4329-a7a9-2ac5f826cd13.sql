-- Fix Security Issue: Remove public SELECT policies from AI training tables
-- These policies expose proprietary hiring criteria to unauthenticated users
-- The edge function uses service role key which bypasses RLS, so these policies are unnecessary

-- Drop the overly permissive public SELECT policies
DROP POLICY IF EXISTS "Public can read training configs" ON public.ai_training_configs;
DROP POLICY IF EXISTS "Public can read training settings" ON public.ai_training_settings;

-- Note: Existing admin policies remain in place:
-- - "Admins can view all training configs" for ai_training_configs
-- - "Admins can view training settings" for ai_training_settings
-- The edge function continues to work via SUPABASE_SERVICE_ROLE_KEY