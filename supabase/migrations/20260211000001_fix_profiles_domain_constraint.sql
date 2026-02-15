-- Fix profiles table domain constraint to support all global domains
-- This migration fixes the "Failed to save your setup" error by allowing all 20+ domains

-- Drop the restrictive CHECK constraint on profiles.selected_domain
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_selected_domain_check;

-- Add new CHECK constraint supporting all global domains
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_selected_domain_check 
CHECK (selected_domain IN (
  'sales', 'crm', 'marketing', 'finance', 'hr', 'it', 'operations', 
  'healthcare', 'education', 'engineering', 'consulting', 'retail', 
  'manufacturing', 'legal', 'hospitality', 'logistics', 'real_estate', 
  'media', 'nonprofit', 'general'
));

-- Also fix the resumes table domain constraint
ALTER TABLE public.resumes 
DROP CONSTRAINT IF EXISTS resumes_domain_check;

ALTER TABLE public.resumes 
ADD CONSTRAINT resumes_domain_check 
CHECK (domain IN (
  'sales', 'crm', 'marketing', 'finance', 'hr', 'it', 'operations', 
  'healthcare', 'education', 'engineering', 'consulting', 'retail', 
  'manufacturing', 'legal', 'hospitality', 'logistics', 'real_estate', 
  'media', 'nonprofit', 'general'
));

-- Add email column constraint to ensure valid email format (optional enhancement)
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_email_format_check 
CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');