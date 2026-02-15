-- Add position and seniority_level columns to resumes table for position-based assessment
-- This fixes the "Could not find the position column" error

-- Add position and seniority level support to resumes table
ALTER TABLE public.resumes 
ADD COLUMN IF NOT EXISTS position TEXT,
ADD COLUMN IF NOT EXISTS seniority_level TEXT 
CHECK (seniority_level IN ('junior', 'mid', 'senior', 'executive'));

-- Add domain column if it doesn't exist (for Plan A domain support)
ALTER TABLE public.resumes
ADD COLUMN IF NOT EXISTS domain TEXT;

-- Update RLS policies to handle new columns
DROP POLICY IF EXISTS "Users can view own resumes" ON public.resumes;
DROP POLICY IF EXISTS "Users can insert own resumes" ON public.resumes;
DROP POLICY IF EXISTS "Admins can view all resumes" ON public.resumes;

-- Recreate policies
CREATE POLICY "Users can view own resumes" ON public.resumes 
FOR SELECT TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own resumes" ON public.resumes 
FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all resumes" ON public.resumes 
FOR SELECT TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

-- Add comment to track migration
COMMENT ON TABLE public.resumes IS 'Resume uploads with position-based assessment support (Plan A)';