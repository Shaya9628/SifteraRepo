-- Add position-based assessment columns to resumes table
-- This enables the new position/seniority system instead of department/domain

-- Add new columns for position-based assessment
ALTER TABLE public.resumes 
ADD COLUMN IF NOT EXISTS position TEXT,
ADD COLUMN IF NOT EXISTS seniority_level TEXT;

-- Add constraints for seniority levels
ALTER TABLE public.resumes 
ADD CONSTRAINT IF NOT EXISTS resumes_seniority_level_check 
CHECK (seniority_level IN ('entry', 'mid', 'senior', 'lead', 'director', 'executive'));

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_resumes_position ON public.resumes(position);
CREATE INDEX IF NOT EXISTS idx_resumes_seniority_level ON public.resumes(seniority_level);

-- Update existing records with default values based on department mapping
UPDATE public.resumes 
SET 
  position = CASE 
    WHEN department = 'sales' THEN 'Sales Representative'
    WHEN department = 'marketing' THEN 'Marketing Specialist' 
    WHEN department = 'hr' THEN 'HR Coordinator'
    WHEN department = 'finance' THEN 'Financial Analyst'
    WHEN department = 'it' THEN 'Software Developer'
    WHEN department = 'operations' THEN 'Operations Coordinator'
    WHEN department = 'crm' THEN 'Customer Success Manager'
    ELSE 'Professional'
  END,
  seniority_level = CASE 
    WHEN status = 'completed' THEN 'mid'
    ELSE 'entry'
  END
WHERE position IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.resumes.position IS 'Job position/role for position-based assessment';
COMMENT ON COLUMN public.resumes.seniority_level IS 'Experience level: entry, mid, senior, lead, director, executive';