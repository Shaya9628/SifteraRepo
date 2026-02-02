-- Add assessment_completed column to profiles table for tracking first assessment completion
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS assessment_completed boolean DEFAULT false;

-- Update existing users who have completed assessments (have completed_at in assessment_progress)
UPDATE public.profiles p
SET assessment_completed = true
WHERE EXISTS (
  SELECT 1 FROM public.assessment_progress ap 
  WHERE ap.user_id = p.id 
  AND ap.completed_at IS NOT NULL
);

-- Also update for users who have assessment_reports (legacy completed assessments)
UPDATE public.profiles p
SET assessment_completed = true
WHERE EXISTS (
  SELECT 1 FROM public.assessment_reports ar 
  WHERE ar.user_id = p.id
);