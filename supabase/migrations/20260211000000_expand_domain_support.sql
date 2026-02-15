-- Fix domain constraints to support all global domains
-- Migrate from limited 'Sales', 'CRM' to all 20 domains

-- Drop existing CHECK constraints and recreate with all domains
ALTER TABLE public.assessment_questions 
DROP CONSTRAINT IF EXISTS assessment_questions_domain_check;

ALTER TABLE public.users 
DROP CONSTRAINT IF EXISTS users_domain_check;

-- Add new CHECK constraints supporting all global domains
ALTER TABLE public.assessment_questions 
ADD CONSTRAINT assessment_questions_domain_check 
CHECK (domain IN (
  'sales', 'crm', 'marketing', 'finance', 'hr', 'it', 'operations', 
  'healthcare', 'education', 'engineering', 'consulting', 'retail', 
  'manufacturing', 'legal', 'hospitality', 'logistics', 'real_estate', 
  'media', 'nonprofit', 'general'
));

ALTER TABLE public.users 
ADD CONSTRAINT users_domain_check 
CHECK (domain IN (
  'sales', 'crm', 'marketing', 'finance', 'hr', 'it', 'operations', 
  'healthcare', 'education', 'engineering', 'consulting', 'retail', 
  'manufacturing', 'legal', 'hospitality', 'logistics', 'real_estate', 
  'media', 'nonprofit', 'general'
));

-- Add position support to existing tables
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS position TEXT,
ADD COLUMN IF NOT EXISTS seniority_level TEXT 
CHECK (seniority_level IN ('junior', 'mid', 'senior', 'executive'));

ALTER TABLE public.resumes 
ADD COLUMN IF NOT EXISTS position TEXT,
ADD COLUMN IF NOT EXISTS seniority_level TEXT 
CHECK (seniority_level IN ('junior', 'mid', 'senior', 'executive'));

ALTER TABLE public.assessment_questions 
ADD COLUMN IF NOT EXISTS position TEXT,
ADD COLUMN IF NOT EXISTS seniority_level TEXT 
CHECK (seniority_level IN ('junior', 'mid', 'senior', 'executive'));

-- Add position-specific AI training support
ALTER TABLE public.ai_training_configs 
ADD COLUMN IF NOT EXISTS position TEXT,
ADD COLUMN IF NOT EXISTS seniority_level TEXT 
CHECK (seniority_level IN ('junior', 'mid', 'senior', 'executive'));

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_assessment_questions_domain_position 
ON public.assessment_questions(domain, position, seniority_level);

CREATE INDEX IF NOT EXISTS idx_resumes_domain_position 
ON public.resumes(domain, position, seniority_level);

-- Update default domain values for existing records to use lowercase
UPDATE public.assessment_questions SET domain = 'sales' WHERE domain = 'Sales';
UPDATE public.assessment_questions SET domain = 'crm' WHERE domain = 'CRM';
UPDATE public.users SET domain = 'sales' WHERE domain = 'Sales';
UPDATE public.users SET domain = 'crm' WHERE domain = 'CRM';